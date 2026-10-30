---
layout: docu
title: ducklake_inlined_data_tables
---

This table links DuckLake table schemas with [inlined data tables]({% link docs/stable/duckdb/advanced_features/data_inlining.md %}).

| Column name       | Column type |             |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `table_name`      | `VARCHAR`   |             |
| `schema_version`  | `BIGINT`    |             |

- `table_id` refers to a `table_id` from the [`ducklake_table` table]({% link docs/stable/specification/tables/ducklake_table.md %}).
- `table_name` is a string that names the data table for inlined data.
- `schema_version` identifies the table schema version in the [`ducklake_schema_versions` table]({% link docs/stable/specification/tables/ducklake_schema_versions.md %}).

Inlined data tables are named `ducklake_inlined_data_⟨table_id⟩_⟨schema_version⟩`{:.language-sql .highlight}. In DuckLake format version 1.1, they start with the `BIGINT` system columns `_ducklake_row_id`, `_ducklake_begin_snapshot`, and `_ducklake_end_snapshot`, followed by user columns. These columns store the logical row id and the snapshots in which the row version becomes visible and stops being visible.

Top-level user column names starting with `_ducklake_` are reserved, ignoring case. Names such as `row_id`, `begin_snapshot`, and `end_snapshot` are allowed as user columns.

Migration from 1.0 renames the three system columns in registered inlined data tables. Inlined deletion tables, named `ducklake_inlined_delete_⟨table_id⟩`{:.language-sql .highlight}, keep their `file_id`, `row_id`, and `begin_snapshot` columns. Their `row_id` is a position within a Parquet data file.

[Snapshot expiration]({% link docs/stable/duckdb/maintenance/expire_snapshots.md %}) removes inlined row versions that no retained snapshot needs.
