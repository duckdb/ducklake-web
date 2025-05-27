---
layout: docu
title: Expire Snapshots
---

DuckLake in normal operation never removes any data, even when tables are dropped or data is deleted.
Due to [time travel]({% link docs/stable/duckdb/usage/time_travel.md %}), the removed data is still accessible.

Data can only be physically removed from DuckLake by expiring snapshots that refer to the old data.
This can be done using the `ducklake_expire_snapshots` function.

### Examples

The below command expires a snapshot with a specific snapshot id.

```sql
CALL ducklake_expire_snapshots('ducklake', versions => [2])
```

The below command expires snapshots older than a week.

```sql
CALL ducklake_expire_snapshots('ducklake', older_than => now() - INTERVAL '1 week')
```

The below command performs a *dry run*, which only lists the snapshots that will be deleted, instead of actually deleting them.

```sql
CALL ducklake_expire_snapshots('ducklake', dry_run => True, older_than => now() - INTERVAL '1 week')
```

### Cleaning Up Files

Note that expiring snapshots does not immediately delete files that are no longer referenced.
See the [cleanup old files]({% link docs/stable/duckdb/maintenance/cleanup_old_files.md %}) section on how to trigger a clean-up of these files.
