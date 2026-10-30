---
layout: docu
title: Conflict Resolution
---

In DuckLake, snapshot identifiers are written in a sequential order.
The first snapshot has `snapshot_id` 0, and subsequent snapshot ids are monotonically increasing such that the second snapshot has id 1, etc.
The sequential nature of snapshot identifiers is used to **detect conflicts** between snapshots. The [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}) has a `PRIMARY KEY` constraint defined over the `snapshot_id` column.

When two connections try to write to a `ducklake` table, they will try to write a snapshot with the same identifier and one of the transactions will trigger a `PRIMARY KEY` constraint violation and fail to commit.
When such a conflict occurs – we try to resolve the conflict. In many cases, such as when both transactions are inserting data into a table, we can retry the commit without having to rewrite any actual files.
During conflict resolution, we query the [`ducklake_snapshot_changes` table]({% link docs/stable/specification/tables/ducklake_snapshot_changes.md %}) to figure out the high-level set of changes that other snapshots have made in the meantime.

* If there are no logical conflicts between the changes that the snapshots have made – we automatically retry the transaction in the metadata catalog without rewriting any data files.
* If there are logical conflicts, we abort the transaction and instruct the user that conflicting changes have been made.

SQLite `database is locked` errors during metadata writes and conflict checks are also retried, using the [retry settings]({% link docs/stable/duckdb/usage/configuration.md %}).
Lock errors from SQLite's final `COMMIT` are not retried.

## Logical Conflicts

Below is a list of logical conflicts based on the snapshot's changeset. Snapshots conflict when any of the following conflicts occur:

### Schemas

* Both snapshots create a schema with the same name under the same parent
* Both snapshots drop the same schema
* A snapshot tries to drop a schema in which another transaction created an entry, including in a descendant schema
* A snapshot tries to create a nested schema whose parent was dropped by another snapshot

### Tables / Views

* Both snapshots create a table or view with the same name in the same schema
* A snapshot tries to create a table or view in a schema that was dropped by another snapshot
* Both snapshots drop the same table or view
* A snapshot tries to alter a table or view that was dropped or altered by another snapshot
* A snapshot tries to rename a table or view that was dropped, altered, or renamed by another snapshot
* A snapshot tries to set a `NOT NULL` constraint on a table into which another snapshot inserted rows

Macros also conflict when both snapshots create a scalar or table macro with the same name in the same schema, when a macro is created in a schema dropped by another snapshot, or when both snapshots drop the same macro.

### Data

* A snapshot tries to insert data into a table that was dropped, altered, or deleted from by another snapshot
* A snapshot tries to delete data from a table that was dropped, altered, or inserted into by another snapshot
* A snapshot tries to delete from a data file compacted by another snapshot
* Two snapshots delete from the same underlying data file, including when one uses a delete file and the other uses inlined deletions. Concurrent deletes from different data files in the same table are permitted.
* Flushing inlined data conflicts with dropping the table, with another flush of the same table, and with concurrent inlined deletions. A flush of already committed inlined deletions of Parquet rows can commit after another snapshot commits a later inlined deletion of the same file. If the flush commits first, the transaction with the later inlined deletion conflicts.

A `DELETE` that matches zero rows still records a delete attempt for conflict checking.
For example, a transaction that deletes a missing key and then inserts that key conflicts with another transaction that concurrently inserts into the same table.

### Compaction

* A snapshot tries to compact a data file that another snapshot deleted from or compacted
* A snapshot tries to compact a table that was dropped by another snapshot

Compactions on different files in the same table can commit concurrently.
