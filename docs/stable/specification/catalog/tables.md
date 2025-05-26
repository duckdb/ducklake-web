---
layout: docu
title: Tables
---

## DuckLake Tables

DuckLake uses 19 tables to store metadata and stage data fragments for data inlining.

> In the DuckDB implementation, DuckLake stores its catalog tables in the `__ducklake_metadata_⟨ducklake_name⟩`{:.language-sql .highlight} catalog.

### `ducklake_column`

| Column Name       | Column Type | Description |
| ----------------- | ----------- | ----------- |
| `column_id`       | `BIGINT`    |             |
| `begin_snapshot`  | `BIGINT`    |             |
| `end_snapshot`    | `BIGINT`    |             |
| `table_id`        | `BIGINT`    |             |
| `column_order`    | `BIGINT`    |             |
| `Column Name`     | `VARCHAR`   |             |
| `Column Type`     | `VARCHAR`   |             |
| `initial_default` | `VARCHAR`   |             |
| `default_value`   | `VARCHAR`   |             |
| `nulls_allowed`   | `BOOLEAN`   |             |
| `parent_column`   | `BIGINT`    |             |

### `ducklake_column_tag`

| Column Name      | Column Type | Description |
| ---------------- | ----------- | ----------- |
| `table_id`       | `BIGINT`    |             |
| `column_id`      | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `key`            | `VARCHAR`   |             |
| `value`          | `VARCHAR`   |             |

### `ducklake_data_file`

| Column Name         | Column Type | Description |
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

| Column Name        | Column Type | Description |
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

| Column Name         | Column Type | Description |
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

| Column Name           | Column Type | Description |
| --------------------- | ----------- | ----------- |
| `data_file_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `partition_value`     | `VARCHAR`   |             |

### `ducklake_files_scheduled_for_deletion`

| Column Name        | Column Type                | Description |
| ------------------ | -------------------------- | ----------- |
| `data_file_id`     | `BIGINT`                   |             |
| `path`             | `VARCHAR`                  |             |
| `path_is_relative` | `BOOLEAN`                  |             |
| `schedule_start`   | `TIMESTAMP WITH TIME ZONE` |             |

### `ducklake_inlined_data_tables`

| Column Name       | Column Type | Description |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `table_name`      | `VARCHAR`   |             |
| `schema_snapshot` | `BIGINT`    |             |

### `ducklake_metadata`

| Column Name | Column Type | Description |
| ----------- | ----------- | ----------- |
| `key`       | `VARCHAR`   |             |
| `value`     | `VARCHAR`   |             |

### `ducklake_partition_column`

| Column Name           | Column Type | Description |
| --------------------- | ----------- | ----------- |
| `partition_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `column_id`           | `BIGINT`    |             |
| `transform`           | `VARCHAR`   |             |

### `ducklake_partition_info`

| Column Name      | Column Type | Description |
| ---------------- | ----------- | ----------- |
| `partition_id`   | `BIGINT`    |             |
| `table_id`       | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |

### `ducklake_schema`

| Column Name      | Column Type | Description |
| ---------------- | ----------- | ----------- |
| `schema_id`      | `BIGINT`    |             |
| `schema_uuid`    | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_name`    | `VARCHAR`   |             |

### `ducklake_snapshot`

| Column Name       | Column Type                | Description |
| ----------------- | -------------------------- | ----------- |
| `snapshot_id`     | `BIGINT`                   |             |
| `snapshot_time`   | `TIMESTAMP WITH TIME ZONE` |             |
| `schema_version`  | `BIGINT`                   |             |
| `next_catalog_id` | `BIGINT`                   |             |
| `next_file_id`    | `BIGINT`                   |             |

### `ducklake_snapshot_changes`

| Column Name    | Column Type | Description |
| -------------- | ----------- | ----------- |
| `snapshot_id`  | `BIGINT`    |             |
| `changes_made` | `VARCHAR`   |             |

### `ducklake_table`

| Column Name      | Column Type | Description |
| ---------------- | ----------- | ----------- |
| `table_id`       | `BIGINT`    |             |
| `table_uuid`     | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_id`      | `BIGINT`    |             |
| `table_name`     | `VARCHAR`   |             |

### `ducklake_table_column_stats`

| Column Name     | Column Type | Description |
| --------------- | ----------- | ----------- |
| `table_id`      | `BIGINT`    |             |
| `column_id`     | `BIGINT`    |             |
| `contains_null` | `BOOLEAN`   |             |
| `contains_nan`  | `BOOLEAN`   |             |
| `min_value`     | `VARCHAR`   |             |
| `max_value`     | `VARCHAR`   |             |

### `ducklake_table_stats`

| Column Name       | Column Type | Description |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `record_count`    | `BIGINT`    |             |
| `next_row_id`     | `BIGINT`    |             |
| `file_size_bytes` | `BIGINT`    |             |

### `ducklake_tag`

| Column Name      | Column Type | Description |
| ---------------- | ----------- | ----------- |
| `object_id`      | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `key`            | `VARCHAR`   |             |
| `value`          | `VARCHAR`   |             |

### `ducklake_view`

| Column Name      | Column Type | Description |
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

