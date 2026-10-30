---
layout: docu
title: Data Change Feed
---

In addition to allowing you to query the [state of the database at any point in time]({% link docs/stable/duckdb/usage/time_travel.md %}),
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
FROM db.table_changes('tbl', now() - INTERVAL '1 week', now());
```

## `table_changes`

The `table_changes` function takes as input the table for which changes should be returned, and two bounds: the start snapshot and the end snapshot (inclusive).
The bounds can be given either as a [snapshot id]({% link docs/stable/duckdb/usage/snapshots.md %}), or as a timestamp.

The result of the function is the set of changes, read using the table schema as of the end snapshot provided, and three extra columns: `snapshot_id`, `rowid`, and `change_type`.

| Column        | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| `snapshot_id` | The snapshot which made the change                          |
| `rowid`       | The row identifier of the row which was changed             |
| `change_type` | `insert`, `update_preimage`, `update_postimage`, or `delete` |

Updates are split into two rows: the `update_preimage` and `update_postimage`.
`update_preimage` is the row as it was prior to the update operation.
`update_postimage` is the row as it is after the update operation.

A row updated and then deleted in one transaction is reported as a deletion of its previously committed version.
A row inserted and deleted within the same transaction is not reported.

If a table has a data column named `rowid` or `snapshot_id`, or a column named `change_type` in the case of `table_changes`, the change feed renames that data column, for example to `rowid_1`, `snapshot_id_1`, or `change_type_1`, so the change columns remain accessible.

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

| id |  val  |
| -: | ----- |
|  1 | Hello |

The result contains the data columns of the table.
There is no `change_type` column because all rows returned are deletions.

`table_deletions` is a wrapper for the `ducklake_table_deletions` function.
To include the deletion snapshot and row identifier, select the virtual columns from the underlying function:

```sql
FROM ducklake_table_deletions('db', 'main', 'tbl', 3, 3)
SELECT snapshot_id, rowid, *;
```

## `table_insertions`

The `table_insertions` function returns only the rows that were *inserted* between two snapshots.
It has the same signature as `table_changes`.

```sql
FROM db.table_insertions('tbl', 2, 2);
```

<div class="monospace_table"></div>

|  id | val      |
| --: | -------- |
|   1 | Hello    |
|   2 | DuckLake |

`table_insertions` is a wrapper for the `ducklake_table_insertions` function.
The virtual `snapshot_id` and `rowid` columns can be selected from the underlying function in the same way as for deletions.

The underlying `ducklake_table_changes`, `ducklake_table_insertions`, and `ducklake_table_deletions` functions take five arguments: `catalog`, `schema_name`, `table_name`, `start_snapshot`, and `end_snapshot`.
The schema argument accepts a dotted path for [nested schemas]({% link docs/stable/duckdb/advanced_features/nested_schemas.md %}), which can also be used in schema-qualified calls such as `db.sales.europe.table_changes(...)`.

## Compaction

Compaction operations that expire snapshots can limit the change feed that can be read.
For example, if deleted rows are removed as part of compaction, these cannot be returned by the change feed anymore.
