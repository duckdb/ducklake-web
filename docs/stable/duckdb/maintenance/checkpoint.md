---
layout: docu
title: Checkpoint
---

DuckLake provides the option to implement all the maintenance functions bundled in the `CHECKPOINT` statement. This statement will run in order the following DuckLake functions:

- `ducklake_flush_inlined_data`
- `ducklake_expire_snapshots`
- `ducklake_merge_adjacent_files`
- `ducklake_rewrite_data_files`
- `ducklake_cleanup_old_files`
- `ducklake_delete_orphaned_files`

## Usage

The `CHECKPOINT` statement takes the following global DuckLake options:

- `rewrite_delete_threshold`: A threshold that determines the minimum amount of data that must be removed from a file before a rewrite is warranted (0...1). Used by `ducklake_rewrite_data_files`. Can be scoped globally, per schema, or per table.
- `delete_older_than`: How old unused files must be to be removed by the `ducklake_delete_orphaned_files` and `ducklake_cleanup_old_files` cleanup functions.
- `expire_older_than`: How old snapshots must be, by default, to be expired by `ducklake_expire_snapshots`.
- `auto_compact`: Whether the compaction functions `ducklake_flush_inlined_data`, `ducklake_merge_adjacent_files` and `ducklake_rewrite_data_files` run on a given table. A table with `auto_compact` set to `false` is skipped even when the table is named in the compaction function call. Defaults to `true`. Can be scoped globally, per schema, or per table. Orphan cleanup through `ducklake_delete_orphaned_files` is controlled only by the global setting.

> **Note** `auto_compact` does not affect `ducklake_expire_snapshots` or `ducklake_cleanup_old_files`. With `auto_compact` set to `false` globally, `CHECKPOINT` still expires snapshots (if `expire_older_than` is set) and removes files scheduled for deletion that are older than `delete_older_than` (2 days by default).

If these options are not provided via the `ducklake.set_option` function, `CHECKPOINT` will use the default values when applicable and will run a `CHECKPOINT` of the whole DuckLake.

```sql
CHECKPOINT;
```

The `ducklake_target_file_size` setting overrides the persistent `target_file_size` option during `CHECKPOINT`.
`CHECKPOINT` also uses S3 credentials configured with `SET` on the calling connection.
