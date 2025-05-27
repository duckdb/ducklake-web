---
layout: docu
title: ducklake_snapshot_changes
---


This table lists changes that happened in a snapshot for easier conflict detection.

| Column name    | Column type |             |
| -------------- | ----------- | ----------- |
| `snapshot_id`  | `BIGINT`    | Primary Key |
| `changes_made` | `VARCHAR`   |             |

The `ducklake_snapshot_changes` table contains a summary of changes made by a snapshot. This table is used during [Conflict Resolution](..) to quickly find out if two snapshots have conflicting changesets.

- `snapshot_id` refers to a `snapshot_id` from the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}).
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
