---
layout: docu
title: Cleanup Old Files
---

When files are no longer required in DuckLake, due to e.g. [snapshots being expired](expiring_snapshots) or [files being merged](merge_adjacent_files), they are not immediately deleted.
The reason for this is that there might still be active queries that are scanning these files.

The files are instead added to the [`ducklake_files_scheduled_for_deletion` table](../../specification/tables/ducklake_files_scheduled_for_deletion).
These files can then be deleted at a later point.
It is generally safe to delete files that have been scheduled for deletion more than a few days ago, provided there are no read transactions that last that long. 
The files can be deleted using the `ducklake_cleanup_old_files` function.

### Examples

The below command deletes all files scheduled for deletion.

```sql
CALL ducklake_cleanup_old_files('ducklake', cleanup_all => True)
```

The below command deletes all files that were scheduled for deletion more than a week ago.

```sql
CALL ducklake_cleanup_old_files('ducklake', older_than => NOW() - INTERVAL '1 week')
```

The below command performs a *dry run*, which only lists the files that will be deleted, instead of actually deleting them.

```sql
CALL ducklake_cleanup_old_files('ducklake', dry_run => True, older_than => NOW() - INTERVAL '1 week')
```
