---
layout: docu
title: Data Change Feed
---

In addition to allowing you to query the [state of the database at any point in time]({% link docs/0.4/duckdb/usage/time_travel.md %}),
DuckLake allows you to query the *changes that were made between any two snapshots*. This can be done using the `table_changes` function.

## Examples

Consider the following DuckLake instance:

```sql
ATTACH 'ducklake:changes.duckdb' AS db (DATA_PATH 'change_files/');
-- Snapshot 1
CREATE TABLE db.tbl (id INTEGER, val VARCHAR);
-- Snapshot 2
INSERT INTO db.tbl VALUES (1, 'Hello'), (2, 'DuckLake');
-- Snapshot 3
DELETE FROM db.tbl WHERE id = 1;
-- Snapshot 4
UPDATE db.tbl SET val = concat(val, val, val);
```

### Changes Made by a Specific Snapshot

```sql
FROM db.table_changes('tbl', 2, 2);
```

<div class="monospace_table"></div>

| snapshot_id | rowid | change_type |  id | val      |
| ----------: | ----: | ----------- | --: | -------- |
|           2 |     0 | insert      |   1 | Hello    |
|           2 |     1 | insert      |   2 | DuckLake |

### Changes Made between Multiple Snapshots

```sql
FROM db.table_changes('tbl', 3, 4)
ORDER BY snapshot_id;
```

<div class="monospace_table"></div>

| snapshot_id | rowid | change_type      |  id | val                      |
| ----------: | ----: | ---------------- | --: | ------------------------ |
|           3 |     0 | delete           |   1 | Hello                    |
|           4 |     1 | update_preimage  |   2 | DuckLake                 |
|           4 |     1 | update_postimage |   2 | DuckLakeDuckLakeDuckLake |

### Changes Made in the Last Week

```sql
FROM changes.table_changes('tbl', now() - INTERVAL '1 week', now());
```

## `table_changes`

The `table_changes` function takes as input the table for which changes should be returned, and two bounds: the start snapshot and the end snapshot (inclusive).
The bounds can be given either as a [snapshot id]({% link docs/0.4/duckdb/usage/snapshots.md %}), or as a timestamp.

The result of the function is the set of changes, read using the table schema as of the end snapshot provided, and three extra columns: `snapshot_id`, `rowid`, and `change_type`.

| Column        | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| `snapshot_id` | The snapshot which made the change                          |
| `rowid`       | The row identifier of the row which was changed             |
| `change_type` | `insert`, `update_preimage`, `update_postimage`, or `delete` |

Updates are split into two rows: the `update_preimage` and `update_postimage`.
`update_preimage` is the row as it was prior to the update operation.
`update_postimage` is the row as it is after the update operation.

When the schema of a table is altered, changes are read as of the schema of the table as of the end snapshot.
As such, if a column is dropped in between the provided bounds, the dropped column is omitted from the entire result.
If a column is added, any changes made to the table prior to the addition of the column will have the column substituted with its default value.

## `table_deletions`

The `table_deletions` function returns only the rows that were *deleted* between two snapshots.
It has the same signature as `table_changes`: it takes a table name and two bounds (start and end snapshot, inclusive), which can be given as snapshot ids or timestamps.

```sql
FROM db.table_deletions('tbl', 3, 3);
```

<div class="monospace_table"></div>

| snapshot_id | rowid | id |  val  |
| ----------: | ----: | -: | ----- |
|           3 |     0 |  1 | Hello |

The result contains `snapshot_id` and `rowid` columns followed by the data columns of the table.
There is no `change_type` column because all rows returned are deletions.

`table_deletions` is an alias for the `ducklake_table_deletions` function.

## `table_insertions`

The `table_insertions` function returns only the rows that were *inserted* between two snapshots.
It has the same signature as `table_changes`.

```sql
FROM db.table_insertions('tbl', 2, 2);
```

<div class="monospace_table"></div>

| snapshot_id | rowid |  id | val      |
| ----------: | ----: | --: | -------- |
|           2 |     0 |   1 | Hello    |
|           2 |     1 |   2 | DuckLake |

`table_insertions` is an alias for the `ducklake_table_insertions` function.

## Compaction

Compaction operations that expire snapshots can limit the change feed that can be read.
For example, if deleted rows are removed as part of compaction, these cannot be returned by the change feed anymore.
