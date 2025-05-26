---
layout: docu
title: Queries
---

## Reading Data
DuckLake specifies tables and update transactions to modify them. DuckLake is not a black box, all metadata is stored as SQL tables under the user's control. Of course, they can be queried in whichever way is best for a client, below we describe a small working example to retrieve table data. 

> The information below is to provide transparency to users and to aid developers making their own implementation of DuckLake. The `ducklake` DuckDB extension is able to execute those operations in the background.


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
  ({SNAPSHOT_ID} < end_snapshot OR end_snapshot IS NULL);
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
   ({SNAPSHOT_ID} < end_snapshot OR end_snapshot IS NULL);
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
 ORDER BY column_order;
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
ORDER BY file_order;
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
	({SCALAR} <= max_value OR max_value IS NULL);
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

where
- `SNAPSHOT_ID` is the new snapshot identifier. This should be `MAX(snapshot_id)+1`. 
- `SCHEMA_VERSION` is the schema version for the new snapshot. If any schema changes are made, this needs to be incremented. Otherwise the previous snapshot's `schema_version` can be re-used. 
- `NEXT_CATALOG_ID` gives the next unused identifier for tables, schemas, or views. This only has to be incremented if new catalog entries are created.
- `NEXT_FILE_ID` is the same but for data or delete files. 
- `CHANGES` contains a list of changes performed by the snapshot.  

TODO: link to table schema of ducklake_snapshot_changes for possible values of `CHANGES`.


### `CREATE SCHEMA`
A schema is a collection of tables. In order to create a new schema, we can just insert into the `ducklake_schema` table:

```SQL
INSERT INTO ducklake_schema 
	(schema_id, schema_uuid, begin_snapshot, end_snapshot, schema_name)
VALUES (
	{SCHEMA_ID}, 
	UUID(), 
	{SNAPSHOT_ID}, 
	NULL, 
	{SCHEMA_NAME});
```

where
- `SCHEMA_ID` is the new schema identifier. This should be created by incrementing `next_catalog_id` from the previous snapshot. 
- `SNAPSHOT_ID` is the snapshot identifier of the new snapshot as described above.
- `SCHEMA_NAME` is just the name of the new schema.

TODO: link to table schema of ducklake_schema

### `CREATE TABLE`
Creating a table in a schema is very similar to creating a schema. We insert into the `ducklake_table` table:

```SQL
INSERT INTO ducklake_table 
	(table_id, table_uuid, begin_snapshot, end_snapshot, schema_id, table_name)
VALUES (
	{TABLE_ID}, 
	UUID(), 
	{SNAPSHOT_ID}, 
	NULL, 
	{SCHEMA_ID},
	{TABLE_NAME});
```

where
- `TABLE_ID` is the new table identifier. This should be created by further incrementing `next_catalog_id` from the previous snapshot. 
- `SNAPSHOT_ID` is the snapshot identifier of the new snapshot as described above.
- `SCHEMA_ID` is a `BIGINT` referring to the `schema_id` column in the `ducklake_schema` table.
- `TABLE_NAME` is just the name of the new table.

TODO: link to table schema of ducklake_table


A table needs some columns, we can add columns to the new table by inserting into the `ducklake_columns` table. For each column to be added, we run the following query:

```SQL
INSERT INTO ducklake_column 
	(column_id, begin_snapshot, end_snapshot, table_id, column_order, column_name, column_type, nulls_allowed)
VALUES (
	{COLUMN_ID}, 
	{SNAPSHOT_ID}, 
	NULL, 
	{TABLE_ID},
	{COLUMN_ORDER},
	{COLUMN_NAME},
	{COLUMN_TYPE},
	{NULLS_ALLOWED});
```

where
- `COLUMN_ID` is the new column identifier. This ID must be unique *within the table* over its entire life time. 
- `SNAPSHOT_ID` is the snapshot identifier of the new snapshot as described above.
- `TABLE_ID` is a `BIGINT` referring to the `table_id` column in the `ducklake_table` table.
- `COLUMN_ORDER` is a number that defines where the column is placed in an ordered list of columns.
- `COLUMN_NAME` is just the name of the column.
- `COLUMN_TYPE` is the data type of the column. See the types list for details.
- `NULLS_ALLOWED` is a boolean that defines if `NULL` values can be stored in the column. Typically set to `true`.


TODO: link to table schema of ducklake_column
TODO: link to data types

> We skipped some complexity in this example around default values and nested types and just left those fields as `NULL`. See the table schema definition for additional details.

### `INSERT`

Inserting data into a DuckLake table consists of two main steps: First, we need to write a Parquet file containing the actual row data to storage, and second, we need to register that file in the metadata tables and update global statistics. Let's assume the file has already been written. 


```SQL
INSERT INTO ducklake_data_file 
	(data_file_id, table_id, begin_snapshot, end_snapshot, path, path_is_relative, file_format, record_count, file_size_bytes, footer_size, row_id_start)
VALUES (
	{DATA_FILE_ID}, 
	{TABLE_ID}, 
	{SNAPSHOT_ID}, 
	NULL,
	{PATH},
	true,
	'parquet',
	{RECORD_COUNT},
	{FILE_SIZE_BYTES},
	{FOOTER_SIZE},
	{ROW_ID_START});

```

where
- `DATA_FILE_ID` is the new data file identifier. This ID must be unique *within the table* over its entire life time. 
- `TABLE_ID` is a `BIGINT` referring to the `table_id` column in the `ducklake_table` table.
- `SNAPSHOT_ID` is the snapshot identifier of the new snapshot as described above.
- `PATH` is the file name relative to the DuckLake data path from the top-level metadata.
- `RECORD_COUNT` is the number of rows in the file.
- `FILE_SIZE_BYTES` is the file size.
- `FOOTER_SIZE` is the position of the Parquet footer. This helps with efficiently reading the file.
- `ROW_ID_START` is the first logical row ID from the file. This number can be read from the `ducklake_table_stats` table , column `next_row_id`.


> We have omitted some complexity around relative paths, encrypted files, partitioning and partial files in this example. Refer to the data file table documentation for details.

TODO: link to table schema of ducklake_data_file

TODO: link to schema evolution

We will also have to update some statistics in the `ducklake_table_stats` and `ducklake_table_column_stats` tables.



```SQL

UPDATE ducklake_table_stats SET 
	record_count = record_count + {RECORD_COUNT}, 
	next_row_id = next_row_id   + {RECORD_COUNT}, 
	file_size_bytes = file_size_bytes + {FILE_SIZE_BYTES} 
WHERE table_id={TABLE_ID};

UPDATE ducklake_table_column_stats SET
	contains_null = contains_null OR {NULL_COUNT} > 0,
	contains_nan  = contains_nan OR {NAN_COUNT} > 0,
	min_value = MIN(min_value, {MIN_VALUE}),
	max_value = MAX(max_value, {MAX_VALUE}) 
WHERE 
	table_id  = {TABLE_ID} AND
	column_id = {COLUMN_ID};

INSERT INTO ducklake_file_column_statistics 
	(data_file_id, table_id, column_id, value_count, null_count, nan_count, min_value, max_value, contains_nan)
VALUES (
	{DATA_FILE_ID},
	{TABLE_ID},
	{COLUMN_ID},
	{RECORD_COUNT},
	{NULL_COUNT},
	{NAN_COUNT},
	{MIN_VALUE},
	{MAX_VALUE},
	{NAN_COUNT} > 0;
)
```

where
- `TABLE_ID` is a `BIGINT` referring to the `table_id` column in the `ducklake_table` table.
- `COLUMN_ID` is a `BIGINT` referring to the `column_id` column in the `ducklakecolumn` table.
- `DATA_FILE_ID` is a `BIGINT` referring to the `data_file_id` column in the `ducklake_data_file` table.
- `RECORD_COUNT` is the number of values (including `NULL` and `NaN`s in the file column.
- `NULL_COUNT` is the number of `NULL` values in the file column.
- `NAN_COUNT` is the number of `NaN` values in the file column (floating-point only).
- `MIN_VALUE` is the *minimum* value in the file column as a string.
- `MAX_VALUE` is the *maximum* value in the file column as a string.
- `FILE_SIZE_BYTES` is the size of the new Parquet file.



> This example assumes there are already rows in the table. If there are none, we need to use `INSERT` instead here.
 We also skipped the `column_size_bytes` column here, it can safely be set to `NULL`.


TODO: link to table schema of ducklake_table_stats, ducklake_table_column_stats and ducklake_file_column_statistics

