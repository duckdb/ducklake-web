---
layout: docu
title: Tables
---

## DuckLake Schema

DuckLake uses 19 tables to store metadata and to stage data fragments for data inlining. Below we describe all those tables and their semantics.

![DuckLake schema](/images/manifesto/ducklake-schema-1.png)

> In DuckDB, the `ducklake` extension stores the catalog tables for a DuckLake named `my_ducklake` in the `__ducklake_metadata_⟨my_ducklake⟩`{:.language-sql .highlight} catalog.


## Snapshots

### `ducklake_snapshot`

This table contains the valid snapshots in a DuckLake.

| Column name       | Column type                |             |
| ----------------- | -------------------------- | ----------- |
| `snapshot_id`     | `BIGINT`                   | Primary Key |
| `snapshot_time`   | `TIMESTAMP`                |
| `schema_version`  | `BIGINT`                   |             |
| `next_catalog_id` | `BIGINT`                   |             |
| `next_file_id`    | `BIGINT`                   |             |

- `snapshot_id` is the numeric identifier of the snapshot. It is a primary key and is referred to by various other tables below.
- `snapshot_time` is the time stamp at which the snapshot was created. 
- `schema_version` is an continously increasing number that is incremented whenever the schema is changed, e.g. by creating a table. This allows for caching of schema information if only data is changed.
- `next_catalog_id` is a continously increasing number that descirbes the next identifier for schemas, tables and views. This is only changed if one of those entries is created, i.e. the schema is changing. 
- `next_file_id` is a continously increasing number that contains the next id for a data or deletion file to be added. It is only changed if data is being added or deleted, i.e. not for schema changes.


### `ducklake_snapshot_changes`

This table lists changes that happened in a snapshot for easier conflict detection.

| Column name    | Column type |             |
| -------------- | ----------- | ----------- |
| `snapshot_id`  | `BIGINT`    | Primary Key |
| `changes_made` | `VARCHAR`   |             |

The `ducklake_snapshot_changes` table contains a summary of changes made by a snapshot. This table is used during [Conflict Resolution](..) to quickly find out if two snapshots have conflicting changesets.

- `snapshot_id` refers to a `snapshot_id` from the `ducklake_snapshot` table.
- `changes_made` is a comma-separated list of high-level changes made by the snapshot. The values that are contained in this list have the following format:

* `created_schema:{SCHEMA_NAME}` - the snapshot created a schema with the given name
* `created_table:{TABLE_NAME}` - the snapshot created a table with the given name
* `created_view:{VIEW_NAME}` - the snapshot created a view with the given name
* `inserted_into_table:{TABLE_ID}` - the snapshot inserted data into the given table.
* `deleted_from_table:{TABLE_ID}` - the snapshot deleted data from the given table.
* `compacted_table:{TABLE_ID}` - the snapshot run a compaction operation on the given table
* `dropped_schema:{SCHEMA_ID}` - the snapshot dropped the given schema.
* `dropped_table:{TABLE_ID}` - the snapshot dropped the given table.
* `dropped_view:{VIEW_ID}` - the snapshot dropped the given view.
* `altered_table:{TABLE_ID}` - the snapshot altered the given table.
* `altered_view:{VIEW_ID}` - the snapshot altered the given view

> Names are written in quoted-format using SQL-style escapes, i.e. the name `this "table" contains quotes` is written as `"this ""table"" contains quotes"`.


## DuckLake Schema

### `ducklake_schema`

This table defines valid schemas.

| Column name      | Column type |             |
| ---------------- | ----------- | ----------- |
| `schema_id`      | `BIGINT`    | Primary Key |
| `schema_uuid`    | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_name`    | `VARCHAR`   |             |


- `schema_id` is the numeric identifier of the schema. `schema_id` is incremented from `next_catalog_id` in the `ducklake_snapshot` table.
- `schema_uuid` is a UUID that gives a persistent identifier for this schema. The UUID is stored here for compatibility with existing Lakehouse formats.
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The schema exists *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The schema exists *until* this snapshot id. If `end_snapshot` is `NULL`, the schema is currently valid. 
- `schema_name` is the name of the schema, e.g. `my_schema`.



### `ducklake_table`

This table describes tables. Inception!

| Column name      | Column type |             |
| ---------------- | ----------- | ----------- |
| `table_id`       | `BIGINT`    |             |
| `table_uuid`     | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_id`      | `BIGINT`    |             |
| `table_name`     | `VARCHAR`   |             |


- `table_id` is the numeric identifier of the table. `table_id` is incremented from `next_catalog_id` in the `ducklake_snapshot` table.
- `table_uuid` is a UUID that gives a persistent identifier for this table. The UUID is stored here for compatibility with existing Lakehouse formats.
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The table exists *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The table exists *until* this snapshot id. If `end_snapshot` is `NULL`, the table is currently valid.
- `schema_id` refers to a `schema_id` from the `ducklake_schema` table. 
- `table_name` is the name of the table, e.g. `my_table`.



### `ducklake_view`

This table describes SQL-style `VIEW` definitions.

| Column name      | Column type |             |
| ---------------- | ----------- | ----------- |
| `view_id`        | `BIGINT`    |             |
| `view_uuid`      | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_id`      | `BIGINT`    |             |
| `view_name`      | `VARCHAR`   |             |
| `dialect`        | `VARCHAR`   |             |
| `sql`            | `VARCHAR`   |             |
| `column_aliases` | `VARCHAR`   |             |


- `view_id` is the numeric identifier of the view.  `view_id` is incremented from `next_catalog_id` in the `ducklake_snapshot` table.
- `view_uuid` is a UUID that gives a persistent identifier for this view. The UUID is stored here for compatibility with existing Lakehouse formats.
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The view exists *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The view exists *until* this snapshot id. If `end_snapshot` is `NULL`, the view is currently valid.
- `schema_id` refers to a `schema_id` from the `ducklake_schema` table. 
- `view_name` is the name of the view, e.g. `my_view`.
- `dialect` is the SQL dialect of the view definition, e.g. `duckdb`.
- `sql` is the SQL string that defines the view, e.g. `SELECT * FROM my_table`
- `column_aliases` contains a possible rename of the view columns. Can be `NULL` if no rename is set.


### `ducklake_column`

This table describes the columns that are part of a table, including their types, default values etc.

| Column name       | Column type |             |
| ----------------- | ----------- | ----------- |
| `column_id`       | `BIGINT`    |             |
| `begin_snapshot`  | `BIGINT`    |             |
| `end_snapshot`    | `BIGINT`    |             |
| `table_id`        | `BIGINT`    |             |
| `column_order`    | `BIGINT`    |             |
| `column_name`     | `VARCHAR`   |             |
| `column_type`     | `VARCHAR`   |             |
| `initial_default` | `VARCHAR`   |             |
| `default_value`   | `VARCHAR`   |             |
| `nulls_allowed`   | `BOOLEAN`   |             |
| `parent_column`   | `BIGINT`    |             |


- `column_id` is the numeric identifier of the column. 
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The column exists *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The column exists *until* this snapshot id. If `end_snapshot` is `NULL`, the view is currently valid.
- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `column_order` is a number that defines the position of the column in the list of columns. it needs to be unique within a snapshot but does not have to be strictly monotonic (holes are ok).
- `column_name` is the name of the column, e.g. `my_column`.
- `column_type` is the type of the column as defined in the list of types.
TODO link to types.
- `initial_default` is the *initial* default value as the column is being created e.g. in `ALTER TABLE`, encoded as a string. Can be `NULL`.
- `default_value` is the *operational* default value as data is being inserted and updated, e.g. in `INSERT`, encoded as a string. Can be `NULL`.
- `nulls_allowed` defines whether `NULL` values are allowed in the column. Note that default values have to be set if this is set to `false`.
- `parent_column` is the `column_id` of the parent column. This is `NULL` for top-level and non-nested columns. For example, for  `STRUCT` types, this would refer to the "parent" struct column .


## Data Files and Tables

### `ducklake_data_file`

Data files contain the actual row data.

| Column name         | Column type |             |
| ------------------- | ----------- | ----------- |
| `data_file_id`      | `BIGINT`    | Primary Key |
| `table_id`          | `BIGINT`    |             |
| `begin_snapshot`    | `BIGINT`    |             |
| `end_snapshot`      | `BIGINT`    |             |
| `file_order`        | `BIGINT`    |             |
| `path`              | `VARCHAR`   |             |
| `path_is_relative`  | `BOOLEAN`   |             |
| `file_format`       | `VARCHAR`   |             |
| `record_count`      | `BIGINT`    |             |
| `file_size_bytes`   | `BIGINT`    |             |
| `footer_size`       | `BIGINT`    |             |
| `row_id_start`      | `BIGINT`    |             |
| `partition_id`      | `BIGINT`    |             |
| `encryption_key`    | `VARCHAR`   |             |
| `partial_file_info` | `VARCHAR`   |             |


- `data_file_id` is the numeric identifier of the file. It is a primary key. `data_file_id` is incremented from `next_file_id` in the `ducklake_snapshot` table.
- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The file is part of the table *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The file is part of the table *until* this snapshot id. If `end_snapshot` is `NULL`, the file is currently part of the table.
- `file_order` is a number that defines the vertical position of the file in the table. it needs to be unique within a snapshot but does not have to be strictly monotonic (holes are ok).
- `path` is the file name of the data file, e.g. `my_file.parquet`. The file name is either relative to the `data_path` value in `ducklake_metadata` or absolute. If relative, the `path_is_relative` field is set to `true`.
- `path_is_relative` defines whether the path is absolute or relative, see above. 
- `file_format` is the storage format of the file. Currently, only `parquet` is allowed.
- `record_count` is the number of records (row) in the file. 
- `file_size_bytes` is the size of the file in Bytes.
- `footer_size` is the size of the file metadata footer, in the case of Parquet the Thrift data. This is an optimization that allows for faster reading of the file.
- `row_id_start` is the first logical row id in the file. TODO: refer to something explaining row ids
- `partition_id` refers to a `partition_id` from the `ducklake_partition_info` table.
- `encryption_key` contains the encryption for the file if encryption is enabled. TODO link to encryption.
- `partial_file_info` TODO ???



### `ducklake_delete_file`

Delete files contains the row ids of rows that are deleted. Each data file will have its own delete file if any deletes are present for this data file.

| Column name        | Column type |             |
| ------------------ | ----------- | ----------- |
| `delete_file_id`   | `BIGINT`    | Primary Key |
| `table_id`         | `BIGINT`    |             |
| `begin_snapshot`   | `BIGINT`    |             |
| `end_snapshot`     | `BIGINT`    |             |
| `data_file_id`     | `BIGINT`    |             |
| `path`             | `VARCHAR`   |             |
| `path_is_relative` | `BOOLEAN`   |             |
| `format`           | `VARCHAR`   |             |
| `delete_count`     | `BIGINT`    |             |
| `file_size_bytes`  | `BIGINT`    |             |
| `footer_size`      | `BIGINT`    |             |
| `encryption_key`   | `VARCHAR`   |             |


- `delete_file_id` is the numeric identifier of the delete file. It is a primary key. `delete_file_id` is incremented from `next_file_id` in the `ducklake_snapshot` table.
- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The delete file is part of the table *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The delete file is part of the table *until* this snapshot id. If `end_snapshot` is `NULL`, the delete file is currently part of the table.
- `data_file_id` refers to a `data_file_id` from the `ducklake_data_file` table. 
- `path` is the file name of the delete file, e.g. `my_file-deletes.parquet`. The file name is either relative to the `data_path` value in `ducklake_metadata` or absolute. If relative, the `path_is_relative` field is set to `true`.
- `path_is_relative` defines whether the path is absolute or relative, see above. 
- `format` is the storage format of the delete file. Currently, only `parquet` is allowed.
- `delete_count` is the number of deletion records in the file. 
- `file_size_bytes` is the size of the file in Bytes.
- `footer_size` is the size of the file metadata footer, in the case of Parquet the Thrift data. This is an optimization that allows for faster reading of the file.
- `encryption_key` contains the encryption for the file if encryption is enabled. TODO link to encryption.


### `ducklake_files_scheduled_for_deletion`

Files that are no longer part of any snapshot are scheduled for deletion

| Column name        | Column type                |             |
| ------------------ | -------------------------- | ----------- |
| `data_file_id`     | `BIGINT`                   |             |
| `path`             | `VARCHAR`                  |             |
| `path_is_relative` | `BOOLEAN`                  |             |
| `schedule_start`   | `TIMESTAMP`                |             |

- `data_file_id` refers to a `data_file_id` from the `ducklake_data_file` table. 
- `path` is the file name of the file, e.g. `my_file.parquet`. The file name is either relative to the `data_path` value in `ducklake_metadata` or absolute. If relative, the `path_is_relative` field is set to `true`.
- `path_is_relative` defines whether the path is absolute or relative, see above. 
- `schedule_start` is a time stamp of when this file was scheduled for deletion.


### `ducklake_inlined_data_tables`

This table links DuckLake snapshots with inlined data tables.

TODO: Link to inlined data tables text. 

| Column name       | Column type |             |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `table_name`      | `VARCHAR`   |             |
| `schema_snapshot` | `BIGINT`    |             |


- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `table_name` is a string that names the data table for inlined data.
- `schema_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. TODO: is this true?





CREATE TABLE ducklake_partition_info(partition_id BIGINT, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT);
CREATE TABLE ducklake_partition_column(partition_id BIGINT, table_id BIGINT, partition_key_index BIGINT, column_id BIGINT, transform VARCHAR);
CREATE TABLE ducklake_file_partition_value(data_file_id BIGINT PRIMARY KEY, table_id BIGINT, partition_key_index BIGINT, partition_value VARCHAR);
CREATE TABLE ducklake_files_scheduled_for_deletion(data_file_id BIGINT, path VARCHAR, path_is_relative BOOLEAN, schedule_start TIMESTAMPTZ);
CREATE TABLE ducklake_inlined_data_tables(table_id BIGINT, table_name VARCHAR, schema_snapshot BIGINT);



CREATE TABLE ducklake_tag(object_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, key VARCHAR, value VARCHAR);
CREATE TABLE ducklake_column_tag(table_id BIGINT, column_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, key VARCHAR, value VARCHAR);




## Statistics


CREATE TABLE ducklake_file_column_statistics(data_file_id BIGINT, table_id BIGINT, column_id BIGINT, column_size_bytes BIGINT, value_count BIGINT, null_count BIGINT, min_value VARCHAR, max_value VARCHAR, contains_nan BOOLEAN);
CREATE TABLE ducklake_table_stats(table_id BIGINT, record_count BIGINT, next_row_id BIGINT, file_size_bytes BIGINT);
CREATE TABLE ducklake_table_column_stats(table_id BIGINT, column_id BIGINT, contains_null BOOLEAN, contains_nan BOOLEAN, min_value VARCHAR, max_value VARCHAR);



### `ducklake_table_stats`

| Column name       | Column type | Description |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `record_count`    | `BIGINT`    |             |
| `next_row_id`     | `BIGINT`    |             |
| `file_size_bytes` | `BIGINT`    |             |



### `ducklake_table_column_stats`

| Column name     | Column type | Description |
| --------------- | ----------- | ----------- |
| `table_id`      | `BIGINT`    |             |
| `column_id`     | `BIGINT`    |             |
| `contains_null` | `BOOLEAN`   |             |
| `contains_nan`  | `BOOLEAN`   |             |
| `min_value`     | `VARCHAR`   |             |
| `max_value`     | `VARCHAR`   |             |


### `ducklake_file_column_statistics`

| Column name         | Column type | Description |
| ------------------- | ----------- | ----------- |
| `data_file_id`      | `BIGINT`    |             |
| `table_id`          | `BIGINT`    |             |
| `column_id`         | `BIGINT`    |             |
| `column_size_bytes` | `BIGINT`    |             |
| `value_count`       | `BIGINT`    |             |
| `null_count`        | `BIGINT`    |             |
| `nan_count`         | `BIGINT`    |             |
| `min_value`         | `VARCHAR`   |             |
| `max_value`         | `VARCHAR`   |             |
| `contains_nan`      | `BOOLEAN`   |             |


## Partitioning Information

### `ducklake_partition_info`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `partition_id`   | `BIGINT`    |             |
| `table_id`       | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |



### `ducklake_partition_column`

| Column name           | Column type | Description |
| --------------------- | ----------- | ----------- |
| `partition_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `column_id`           | `BIGINT`    |             |
| `transform`           | `VARCHAR`   |             |


### `ducklake_file_partition_value`

| Column name           | Column type | Description |
| --------------------- | ----------- | ----------- |
| `data_file_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `partition_value`     | `VARCHAR`   |             |


## Auxiliary Tables

### `ducklake_metadata`

The `ducklake_metadata` table contains key/value pairs with information about the specific setup of the DuckLake catalog.

| Column name | Column type |             |
| ----------- | ----------- | ----------- |
| `key`       | `VARCHAR`   | Not `NULL`  |
| `value`     | `VARCHAR`   | Not `NULL`  |

- `key` is an arbitrary key string. See below for a list of pre-defined keys. The key can't be `NULL`.
- `value` is the arbitrary value string.

Currently, the following keys are specified:

* `version`: The DuckLake schema version, currently `0.1`.
* `created_by`: A string that identifies which program wrote the schema, e.g., `DuckDB v1.3.0`
* `data_path`: The data path prefix for reading and writing data files, e.g., `s3://mybucket/myprefix/`. This always ends in a `/`.
* `encryption`: A boolean (`true` or `false`) that speficies whether data files are encrypted or not.



### `ducklake_tag`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `object_id`      | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `key`            | `VARCHAR`   |             |
| `value`          | `VARCHAR`   |             |



### `ducklake_column_tag`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `table_id`       | `BIGINT`    |             |
| `column_id`      | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `key`            | `VARCHAR`   |             |
| `value`          | `VARCHAR`   |             |


## Full Schema Creation Script
Below is the full SQL script to create a DuckLake metadata database:
```sql
CREATE TABLE ducklake_metadata(key VARCHAR NOT NULL, value VARCHAR NOT NULL);
CREATE TABLE ducklake_snapshot(snapshot_id BIGINT PRIMARY KEY, snapshot_time TIMESTAMPTZ, schema_version BIGINT, next_catalog_id BIGINT, next_file_id BIGINT);
CREATE TABLE ducklake_snapshot_changes(snapshot_id BIGINT PRIMARY KEY, changes_made VARCHAR);
CREATE TABLE ducklake_schema(schema_id BIGINT PRIMARY KEY, schema_uuid UUID, begin_snapshot BIGINT, end_snapshot BIGINT, schema_name VARCHAR);
CREATE TABLE ducklake_table(table_id BIGINT, table_uuid UUID, begin_snapshot BIGINT, end_snapshot BIGINT, schema_id BIGINT, table_name VARCHAR);
CREATE TABLE ducklake_view(view_id BIGINT, view_uuid UUID, begin_snapshot BIGINT, end_snapshot BIGINT, schema_id BIGINT, view_name VARCHAR, dialect VARCHAR, sql VARCHAR, column_aliases VARCHAR);
CREATE TABLE ducklake_tag(object_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, key VARCHAR, value VARCHAR);
CREATE TABLE ducklake_column_tag(table_id BIGINT, column_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, key VARCHAR, value VARCHAR);
CREATE TABLE ducklake_data_file(data_file_id BIGINT PRIMARY KEY, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, file_order BIGINT, path VARCHAR, path_is_relative BOOLEAN, file_format VARCHAR, record_count BIGINT, file_size_bytes BIGINT, footer_size BIGINT, row_id_start BIGINT, partition_id BIGINT, encryption_key VARCHAR, partial_file_info VARCHAR);
CREATE TABLE ducklake_file_column_statistics(data_file_id BIGINT, table_id BIGINT, column_id BIGINT, column_size_bytes BIGINT, value_count BIGINT, null_count BIGINT, min_value VARCHAR, max_value VARCHAR, contains_nan BOOLEAN);
CREATE TABLE ducklake_delete_file(delete_file_id BIGINT PRIMARY KEY, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, data_file_id BIGINT, path VARCHAR, path_is_relative BOOLEAN, format VARCHAR, delete_count BIGINT, file_size_bytes BIGINT, footer_size BIGINT, encryption_key VARCHAR);
CREATE TABLE ducklake_column(column_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, table_id BIGINT, column_order BIGINT, column_name VARCHAR, column_type VARCHAR, initial_default VARCHAR, default_value VARCHAR, nulls_allowed BOOLEAN, parent_column BIGINT);
CREATE TABLE ducklake_table_stats(table_id BIGINT, record_count BIGINT, next_row_id BIGINT, file_size_bytes BIGINT);
CREATE TABLE ducklake_table_column_stats(table_id BIGINT, column_id BIGINT, contains_null BOOLEAN, contains_nan BOOLEAN, min_value VARCHAR, max_value VARCHAR);
CREATE TABLE ducklake_partition_info(partition_id BIGINT, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT);
CREATE TABLE ducklake_partition_column(partition_id BIGINT, table_id BIGINT, partition_key_index BIGINT, column_id BIGINT, transform VARCHAR);
CREATE TABLE ducklake_file_partition_value(data_file_id BIGINT PRIMARY KEY, table_id BIGINT, partition_key_index BIGINT, partition_value VARCHAR);
CREATE TABLE ducklake_files_scheduled_for_deletion(data_file_id BIGINT, path VARCHAR, path_is_relative BOOLEAN, schedule_start TIMESTAMPTZ);
CREATE TABLE ducklake_inlined_data_tables(table_id BIGINT, table_name VARCHAR, schema_snapshot BIGINT);
```


