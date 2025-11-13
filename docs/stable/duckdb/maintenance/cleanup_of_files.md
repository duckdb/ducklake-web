---
layout: docu
title: Cleanup of Files
---

In DuckLake you may want to delete data files that are either a part of an expired snapshot or are simply not tracked by DuckLake anymore (i.e., orphaned files).

## Cleanup of Files from Expired Snapshots

When files are no longer required in DuckLake, due to e.g. [snapshots being expired]({% link docs/stable/duckdb/maintenance/expire_snapshots.md %}) or [files being merged]({% link docs/stable/duckdb/maintenance/merge_adjacent_files.md %}), they are not immediately deleted.
The reason for this is that there might still be active queries that are scanning these files.

The files are instead added to the [`ducklake_files_scheduled_for_deletion` table]({% link docs/stable/specification/tables/ducklake_files_scheduled_for_deletion.md %}).
These files can then be deleted at a later point.
It is generally safe to delete files that have been scheduled for deletion more than a few days ago, provided there are no read transactions that last that long.
The files can be deleted using the `ducklake_cleanup_old_files` function.

### Usage of the `ducklake_cleanup_old_files` Function

The below command deletes all files scheduled for deletion.

```sql
CALL ducklake_cleanup_old_files(
    'my_ducklake',
    cleanup_all => true
);
```

The below command deletes all files that were scheduled for deletion more than a week ago.

```sql
CALL ducklake_cleanup_old_files(
    'my_ducklake',
    older_than => now() - INTERVAL '1 week'
);
```

The below command performs a *dry run*, which only lists the files that will be deleted, instead of actually deleting them.

```sql
CALL ducklake_cleanup_old_files(
    'my_ducklake',
    dry_run => true,
    older_than => now() - INTERVAL '1 week'
);
```

## Cleanup of Orphaned Files

Orphan files are files that are untracked by the DuckLake metadata catalog. They may appear due to, for example, a systems failure. DuckLake provides the `ducklake_delete_orphaned_files` function to delete these files.

### Usage of the `ducklake_delete_orphaned_files` Function

The below command deletes all orphaned files.

```sql
CALL ducklake_delete_orphaned_files(
    'my_ducklake',
    cleanup_all => true
);
```

The below command deletes all files that are older than a specified time.

```sql
CALL ducklake_delete_orphaned_files(
    'my_ducklake',
    older_than => now() - INTERVAL '1 week'
);
```

The below command performs a *dry run*, which only lists the files that will be deleted, instead of actually deleting them.

```sql
CALL ducklake_delete_orphaned_files(
    'my_ducklake',
    dry_run => true,
    older_than => now() - INTERVAL '1 week'
);
```

There is also a catalog-level option available.

```sql
CALL ducklake.set_option('delete_older_than', '1 week');
```
