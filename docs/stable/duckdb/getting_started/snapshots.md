---
layout: docu
title: Snapshots
---

Snapshots represent commits made to DuckLake.
Every snapshot performs a set of changes that alter the state of the database.
Snapshots can create tables, insert or delete data, and alter schemas.

Changes can only be made to DuckLake using snapshots.
Every set of changes must be accompanied by a snapshot.

## Snapshots

The set of snapshots can be queried using the `snapshots()` function.
This returns a list of all snapshots. For example:

```sql
ATTACH 'ducklake:snapshot_test.db' (DATA_PATH 'snapshot_files');
USE snapshot_test;
CREATE TABLE tbl (i INTEGER);
INSERT INTO tbl VALUES (1), (2), (3);
DELETE FROM tbl WHERE i = 2;
SELECT * FROM snapshots();
```

| snapshot_id |       snapshot_time        | schema_version |           changes           |
|------------:|----------------------------|---------------:|-----------------------------|
| 0           | 2025-05-26 17:03:37.746+00 | 0              | {schemas_created=[main]}    |
| 1           | 2025-05-26 17:03:38.66+00  | 1              | {tables_created=[main.tbl]} |
| 2           | 2025-05-26 17:03:38.748+00 | 1              | {tables_inserted_into=[1]}  |
| 3           | 2025-05-26 17:03:39.788+00 | 1              | {tables_deleted_from=[1]}   |
