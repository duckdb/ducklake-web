---
layout: docu
title: ducklake_inlined_data_tables
---

This table links DuckLake snapshots with [inlined data tables]({% link docs/stable/duckdb/advanced_features/data_inlining.md %}).

| Column name       | Column type |             |
| ----------------- | ----------- | ----------- |
| `table_id`        | `BIGINT`    |             |
| `table_name`      | `VARCHAR`   |             |
| `schema_snapshot` | `BIGINT`    |             |

- `table_id` refers to a `table_id` from the `ducklake_table` table.
- `table_name` is a string that names the data table for inlined data.
- `schema_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. TODO: is this true?
