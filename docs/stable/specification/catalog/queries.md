---
layout: docu
title: Queries
---

## Reading Data
DuckLake specifies tables and update transactions to modify them. DuckLake is not a black box, all metadata is stored as SQL tables under the user's control. Of course, they can be queried in whichever way is best for a client, below we describe a small working example to retrieve table data.


### Get Current Snapshot
Before anything else we need to find a snapshot ID to be queries. There can be many snapshots in the `ducklake_snapshot` table. A snapshot ID is a continously increasing number that identifies a snapshot. In most cases, you would query the most recent one like so: 

```SQL
SELECT snapshot_id FROM ducklake_snapshot 
WHERE snapshot_id = 
	(SELECT MAX(snapshot_id) FROM ducklake_snapshot);
```

TODO: link to table schema of ducklake_snapshot

### List Schemas
A DuckLake catalog can contain many SQL-style schemas, which each can contain many tables. Here's how we get the list of valid schemas for a given snapshot:

```SQL
SELECT schema_id, schema_name
FROM ducklake_schema
WHERE 
  {SNAPSHOT_ID} >= begin_snapshot AND 
  ({SNAPSHOT_ID} < end_snapshot OR end_snapshot IS NULL)
```

where
- `SNAPSHOT_ID` is a `BIGINT` referring to the `snapshot_id` column in the `ducklake_snapshot` table.


TODO: link to table schema of ducklake_schema


### List Tables 
We can list the tables available in a schema for a specific snapshot like so:

 ```SQL
 SELECT table_id, table_name 
 FROM ducklake_table
 WHERE 
   schema_id = {SCHEMA_ID} AND
   {SNAPSHOT_ID} >= begin_snapshot AND 
   ({SNAPSHOT_ID} < end_snapshot OR end_snapshot IS NULL)
```

where
- `SCHEMA_ID` is a `BIGINT` referring to the `schema_id` column in the `ducklake_schema` table.
- `SNAPSHOT_ID` is a `BIGINT` referring to the `snapshot_id` column in the `ducklake_snapshot` table.


TODO: link to table schema of ducklake_table


### Show structure of a table

For each given table, we can list the available top-level columns like so:

 ```SQL
 SELECT column_id, column_name, column_type
 FROM ducklake_column
 WHERE 
   table_id = {TABLE_ID} AND
   parent_column IS NULL AND
   {SNAPSHOT_ID} >= begin_snapshot AND 
   ({SNAPSHOT_ID} < end_snapshot OR end_snapshot IS NULL)
 ORDER BY column_order
```

where
- `TABLE_ID` is a `BIGINT` referring to the `table_id` column in the `ducklake_table` table.
- `SNAPSHOT_ID` is a `BIGINT` referring to the `snapshot_id` column in the `ducklake_snapshot` table.

> Note that DuckLake supports nested columns - the filter for `parent_column IS NULL` only shows the top-level columns.

Refer to the list of data types for details on types.
TODO: link

TODO: link to table schema of ducklake_column


### `SELECT` 

Now that we know the table structure we can query actual data from the Parquet files that store table data. We need to join the list of data files with the list of delete files (if any). There can be at most one delete file per file in a single snapshot.

```SQL
SELECT data.path data_file_path, del.path as delete_file_path
FROM ducklake_data_file AS data
LEFT JOIN (
    SELECT *
    FROM ducklake_delete_file
    WHERE 
    	{SNAPSHOT_ID} >= begin_snapshot AND 
    	({SNAPSHOT_ID} < end_snapshot OR end_snapshot IS NULL)
    ) AS del 
USING (data_file_id)
WHERE 
	data.table_id = {TABLE_ID} AND 
	{SNAPSHOT_ID} >= data.begin_snapshot AND 
	({SNAPSHOT_ID} < data.end_snapshot OR data.end_snapshot IS NULL)
ORDER BY file_order
```	

where (again)
- `TABLE_ID` is a `BIGINT` referring to the `table_id` column in the `ducklake_table` table.
- `SNAPSHOT_ID` is a `BIGINT` referring to the `snapshot_id` column in the `ducklake_snapshot` table.

Now we have a list of files. In order to reconstruct actual table rows, we need to read all rows from the `data_file_path` files and remove the rows labeled as deleted in the `delete_file_path`. 

Not all files have to contain all the columns currently defined in the table, some files may also have columns that existed previously but have been removed. 

TODO link to schema evolution page

> In DuckLake, paths can be relative to the initially specified data path. Whether path is relative or not is stored in the `ducklake_data_file` and `ducklake_delete_file` entries (`path_is_relative`) to the `data_path` prefix from `ducklake_metadata`.

TODO: link to table schema of ducklake_metadata, ducklake_data_file and ducklake_delete_file


### `SELECT` with file pruning
One of the main strengths of Lakehouse formats is the ability to *prune* files that cannot contain data relevant to the query. The `ducklake_file_column_statistics` contains the file-level statistics. We can use the information there to prune the list of files to be read if a filter predicate is given.

We can get a list of all files that are part of a given table like described above. We can then reduce that list to only relevant files by querying the per-file column statistics. For example, for scalar equality we can find the relevant files using the query below:

```SQL
SELECT data_file_id 
FROM ducklake_file_column_statistics 
WHERE 
	table_id  = {TABLE_ID} AND
	column_id = {COLUMN_ID} AND 
    ({SCALAR} >= min_value OR min_value IS NULL) AND
	({SCALAR} <= max_value OR max_value IS NULL)
```	

where (again)
- `TABLE_ID` is a `BIGINT` referring to the `table_id` column in the `ducklake_table` table.
- `COLUMN_ID` is a `BIGINT` referring to the `column_id` column in the `ducklake_column` table.
- `SCALAR` is the scalar comparision value for the pruning.

Of course, other filter predicates like greater than etc. will require slighlty different filtering here.

> The minimum and maximum values for each column are stored as strings and need to be cast for correct range filters on numeric columns.

TODO: link to table schema of ducklake_file_column_statistics


## Writing Data


### Snapshot Creation
Any changes to data stored in DuckLake require the creation of a new snapshot. We need to 
- create a new snapshot in `ducklake_snapshot` and
- log the changes a snapshot made in `ducklake_snapshot_changes`

```SQL
INSERT INTO ducklake_snapshot 
	(snapshot_id, snapshot_timestamp, schema_version, next_catalog_id, next_file_id)
VALUES (
	{SNAPSHOT_ID}, 
	NOW(), 
	{SCHEMA_VERSION}, 
	{NEXT_CATALOG_ID}, 
	{NEXT_FILE_ID});

INSERT INTO ducklake_snapshot_changes 
	(snapshot_id, snapshot_changes)
VALUES (
	{SNAPSHOT_ID}, 
	{CHANGES});
```

where (again)
- `SNAPSHOT_ID` is the new snapshot id. This should be `MAX(snapshot_id)+1`. 
- `SCHEMA_VERSION` is the schema version for the new snapshot. If any schema changes are made, this needs to be incremented. Otherwise the previous snapshot's `schema_version` can be re-used. 
- `NEXT_CATALOG_ID` gives the next unused identifier for tables, schemas, or views. This only has to be incremented if new catalog entries are created.
- `NEXT_FILE_ID` is the same but for data or delete files. 
- `CHANGES` contains a list of changes performed by the snapshot.  

TODO: link to table schema of ducklake_snapshot_changes for possible values of `CHANGES`.


### CREATE SCHEMA

### CREATE TABLE

### INSERT

### DELETE

### DROP TABLE
just set end snapshot
