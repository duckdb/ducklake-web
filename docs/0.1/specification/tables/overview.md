---
layout: docu
title: Tables
---

DuckLake uses 19 tables to store metadata and to stage data fragments for data inlining. Below we describe all those tables and their semantics.

![DuckLake schema]({{ site.baseurl }}/images/manifesto/ducklake-schema-1.png)

## Snapshots

* [`ducklake_snapshot`]({% link docs/stable/specification/tables/ducklake_snapshot.md %})
* [`ducklake_snapshot_changes`]({% link docs/stable/specification/tables/ducklake_snapshot_changes.md %})

## DuckLake Schema

* [`ducklake_schema`]({% link docs/stable/specification/tables/ducklake_schema.md %})
* [`ducklake_table`]({% link docs/stable/specification/tables/ducklake_table.md %})
* [`ducklake_view`]({% link docs/stable/specification/tables/ducklake_view.md %})
* [`ducklake_column`]({% link docs/stable/specification/tables/ducklake_column.md %})

## Data Files and Tables

* [`ducklake_data_file`]({% link docs/stable/specification/tables/ducklake_data_file.md %})
* [`ducklake_delete_file`]({% link docs/stable/specification/tables/ducklake_delete_file.md %})
* [`ducklake_files_scheduled_for_deletion`]({% link docs/stable/specification/tables/ducklake_files_scheduled_for_deletion.md %})
* [`ducklake_inlined_data_tables`]({% link docs/stable/specification/tables/ducklake_inlined_data_tables.md %})

## Statistics

DuckLake supports statistics on the table, column and file level.

* [`ducklake_table_stats`]({% link docs/stable/specification/tables/ducklake_table_stats.md %})
* [`ducklake_table_column_stats`]({% link docs/stable/specification/tables/ducklake_table_column_stats.md %})
* [`ducklake_file_column_statistics`]({% link docs/stable/specification/tables/ducklake_file_column_statistics.md %})

## Partitioning Information

DuckLake supports defining explicit partitioning.

* [`ducklake_partition_info`]({% link docs/stable/specification/tables/ducklake_metadata.md %})
* [`ducklake_partition_column`]({% link docs/stable/specification/tables/ducklake_tag.md %})
* [`ducklake_file_partition_value`]({% link docs/stable/specification/tables/ducklake_column_tag.md %})

## Auxiliary Tables

* [`ducklake_metadata`]({% link docs/stable/specification/tables/ducklake_metadata.md %})
* [`ducklake_tag`]({% link docs/stable/specification/tables/ducklake_tag.md %})
* [`ducklake_column_tag`]({% link docs/stable/specification/tables/ducklake_column_tag.md %})

## Full Schema Creation Script

Below is the full SQL script to create a DuckLake metadata database:

```sql
CREATE TABLE ducklake_metadata (key VARCHAR NOT NULL, value VARCHAR NOT NULL);
CREATE TABLE ducklake_snapshot (snapshot_id BIGINT PRIMARY KEY, snapshot_time TIMESTAMPTZ, schema_version BIGINT, next_catalog_id BIGINT, next_file_id BIGINT);
CREATE TABLE ducklake_snapshot_changes (snapshot_id BIGINT PRIMARY KEY, changes_made VARCHAR);
CREATE TABLE ducklake_schema (schema_id BIGINT PRIMARY KEY, schema_uuid UUID, begin_snapshot BIGINT, end_snapshot BIGINT, schema_name VARCHAR);
CREATE TABLE ducklake_table (table_id BIGINT, table_uuid UUID, begin_snapshot BIGINT, end_snapshot BIGINT, schema_id BIGINT, table_name VARCHAR);
CREATE TABLE ducklake_view (view_id BIGINT, view_uuid UUID, begin_snapshot BIGINT, end_snapshot BIGINT, schema_id BIGINT, view_name VARCHAR, dialect VARCHAR, sql VARCHAR, column_aliases VARCHAR);
CREATE TABLE ducklake_tag (object_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, key VARCHAR, value VARCHAR);
CREATE TABLE ducklake_column_tag (table_id BIGINT, column_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, key VARCHAR, value VARCHAR);
CREATE TABLE ducklake_data_file (data_file_id BIGINT PRIMARY KEY, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, file_order BIGINT, path VARCHAR, path_is_relative BOOLEAN, file_format VARCHAR, record_count BIGINT, file_size_bytes BIGINT, footer_size BIGINT, row_id_start BIGINT, partition_id BIGINT, encryption_key VARCHAR, partial_file_info VARCHAR);
CREATE TABLE ducklake_file_column_statistics (data_file_id BIGINT, table_id BIGINT, column_id BIGINT, column_size_bytes BIGINT, value_count BIGINT, null_count BIGINT, min_value VARCHAR, max_value VARCHAR, contains_nan BOOLEAN);
CREATE TABLE ducklake_delete_file (delete_file_id BIGINT PRIMARY KEY, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, data_file_id BIGINT, path VARCHAR, path_is_relative BOOLEAN, format VARCHAR, delete_count BIGINT, file_size_bytes BIGINT, footer_size BIGINT, encryption_key VARCHAR);
CREATE TABLE ducklake_column (column_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT, table_id BIGINT, column_order BIGINT, column_name VARCHAR, column_type VARCHAR, initial_default VARCHAR, default_value VARCHAR, nulls_allowed BOOLEAN, parent_column BIGINT);
CREATE TABLE ducklake_table_stats (table_id BIGINT, record_count BIGINT, next_row_id BIGINT, file_size_bytes BIGINT);
CREATE TABLE ducklake_table_column_stats (table_id BIGINT, column_id BIGINT, contains_null BOOLEAN, contains_nan BOOLEAN, min_value VARCHAR, max_value VARCHAR);
CREATE TABLE ducklake_partition_info (partition_id BIGINT, table_id BIGINT, begin_snapshot BIGINT, end_snapshot BIGINT);
CREATE TABLE ducklake_partition_column (partition_id BIGINT, table_id BIGINT, partition_key_index BIGINT, column_id BIGINT, transform VARCHAR);
CREATE TABLE ducklake_file_partition_value (data_file_id BIGINT PRIMARY KEY, table_id BIGINT, partition_key_index BIGINT, partition_value VARCHAR);
CREATE TABLE ducklake_files_scheduled_for_deletion (data_file_id BIGINT, path VARCHAR, path_is_relative BOOLEAN, schedule_start TIMESTAMPTZ);
CREATE TABLE ducklake_inlined_data_tables (table_id BIGINT, table_name VARCHAR, schema_snapshot BIGINT);
```
