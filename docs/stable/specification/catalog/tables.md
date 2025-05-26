---
layout: docu
title: Tables
---

## DuckLake Schema

DuckLake uses 19 tables to store metadata and stage data fragments for data inlining.

![DuckLake schema](/images/manifesto/ducklake-schema.svg)

> In DuckDB, the `ducklake` extension stores the catalog tables for a DuckLake named `my_ducklake` in the `__ducklake_metadata_⟨my_ducklake⟩`{:.language-sql .highlight} catalog.

## DuckLake Tables

### `ducklake_column`

| Column name       | Column type | Description |
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

### `ducklake_column_tag`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `table_id`       | `BIGINT`    |             |
| `column_id`      | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `key`            | `VARCHAR`   |             |
| `value`          | `VARCHAR`   |             |

### `ducklake_data_file`

| Column name         | Column type | Description |
| ------------------- | ----------- | ----------- |
| `data_file_id`      | `BIGINT`    |             |
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

### `ducklake_delete_file`

| Column name        | Column type | Description |
| ------------------ | ----------- | ----------- |
| `delete_file_id`   | `BIGINT`    |             |
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

### `ducklake_file_partition_value`

| Column name           | Column type | Description |
| --------------------- | ----------- | ----------- |
| `data_file_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `partition_value`     | `VARCHAR`   |             |

### `ducklake_files_scheduled_for_deletion`

| Column name        | Column type                | Description |
| ------------------ | -------------------------- | ----------- |
| `data_file_id`     | `BIGINT`                   |             |
| `path`             | `VARCHAR`                  |             |
| `path_is_relative` | `BOOLEAN`                  |             |
| `schedule_start`   | `TIMESTAMP WITH TIME ZONE` |             |

### `ducklake_inlined_data_tables`

| Column name       | Column type | Description |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `table_name`      | `VARCHAR`   |             |
| `schema_snapshot` | `BIGINT`    |             |

### `ducklake_metadata`

| Column name | Column type | Description |
| ----------- | ----------- | ----------- |
| `key`       | `VARCHAR`   |             |
| `value`     | `VARCHAR`   |             |


The `ducklake_metadata` table contains key/value pairs with information about the specific setup of the DuckLake catalog. Currently, the following keys are specified:
- `version`: The DuckLake schema version, currently `0.1`.
- `created_by`: A string that identifies which program wrote the schema, e.g. `DuckDB v1.3.0`
- `data_path`: The data path prefix for reading and writing data files. E.g., `s3://mybucket/myprefix/`. This always ends in a `/`.
- `encryption`: a boolean (`true` or `false`) that speficies whether data files are encrypted or not.



### `ducklake_partition_column`

| Column name           | Column type | Description |
| --------------------- | ----------- | ----------- |
| `partition_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `column_id`           | `BIGINT`    |             |
| `transform`           | `VARCHAR`   |             |

### `ducklake_partition_info`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `partition_id`   | `BIGINT`    |             |
| `table_id`       | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |

### `ducklake_schema`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `schema_id`      | `BIGINT`    |             |
| `schema_uuid`    | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_name`    | `VARCHAR`   |             |

### `ducklake_snapshot`

| Column name       | Column type                | Description |
| ----------------- | -------------------------- | ----------- |
| `snapshot_id`     | `BIGINT`                   |             |
| `snapshot_time`   | `TIMESTAMP WITH TIME ZONE` |             |
| `schema_version`  | `BIGINT`                   |             |
| `next_catalog_id` | `BIGINT`                   |             |
| `next_file_id`    | `BIGINT`                   |             |

### `ducklake_snapshot_changes`

| Column name    | Column type | Description |
| -------------- | ----------- | ----------- |
| `snapshot_id`  | `BIGINT`    |             |
| `changes_made` | `VARCHAR`   |             |

The `ducklake_snapshot_changes` table contains a summary of changes made by a snapshot. This table is used during [Conflict Resolution](..) to quickly find out if two snapshots have conflicting changesets.

`changes_made` is a comma-separated list of high-level changes made by the snapshot. The values that are contained in this list have the following format:

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

### `ducklake_table`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `table_id`       | `BIGINT`    |             |
| `table_uuid`     | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_id`      | `BIGINT`    |             |
| `table_name`     | `VARCHAR`   |             |

### `ducklake_table_column_stats`

| Column name     | Column type | Description |
| --------------- | ----------- | ----------- |
| `table_id`      | `BIGINT`    |             |
| `column_id`     | `BIGINT`    |             |
| `contains_null` | `BOOLEAN`   |             |
| `contains_nan`  | `BOOLEAN`   |             |
| `min_value`     | `VARCHAR`   |             |
| `max_value`     | `VARCHAR`   |             |

### `ducklake_table_stats`

| Column name       | Column type | Description |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `record_count`    | `BIGINT`    |             |
| `next_row_id`     | `BIGINT`    |             |
| `file_size_bytes` | `BIGINT`    |             |

### `ducklake_tag`

| Column name      | Column type | Description |
| ---------------- | ----------- | ----------- |
| `object_id`      | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `key`            | `VARCHAR`   |             |
| `value`          | `VARCHAR`   |             |

### `ducklake_view`

| Column name      | Column type | Description |
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
