---
layout: docu
title: Time Travel
---

In DuckLake, every [snapshot](snapshots) represents a consistent state of the database.
DuckLake keeps a record of all historic snapshots and their changesets, unless [compaction](../advanced_features/compaction) is triggered and historic snapshots are explicitly deleted.

Using time travel, it is possible to query the state of the database as of any recorded snapshot.
The snapshot to query can be specified either (1) using a timestamp, or (2) explicitly using a snapshot identifier.
The `snapshots` function can be used to obtain a list of valid snapshots for a given DuckLake database.

## Examples

Query the table at a specific snapshot version.

```sql
SELECT * FROM tbl AT (VERSION => 3);
```

Query the table as it was last week.

```sql
SELECT * FROM tbl AT (TIMESTAMP => NOW() - INTERVAL '1 week');
```

Attach a DuckLake database at a specific snapshot version.

```sql
ATTACH 'ducklake:file.db' (SNAPSHOT_VERSION 3);
```

Attach a DuckLake database as it was at a specific time.

```sql
ATTACH 'ducklake:file.db' (SNAPSHOT_TIME '2025-05-26 00:00:00');
```
