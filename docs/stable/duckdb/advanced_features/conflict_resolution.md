---
layout: docu
title: Conflict Resolution
---

In DuckLake, snapshot identifiers are written in a sequential order.
The first snapshot has `snapshot_id` 0, and subsequent snapshot ids are monotonically increasing such that the second snapshot has id 1, etc.
The sequential nature of snapshot identifiers is used to **detect conflicts** between snapshots. The [`ducklake_snapshot` table]({% link docs/stable/specification/catalog/tables.md %}#ducklake_snapshot) has a `PRIMARY KEY` constraint defined over the `snapshot_id` column.

When two connections try to write to a `ducklake` table, they will try to write a snapshot with the same identifier and one of the transactions will trigger a `PRIMARY KEY` constraint violation and fail to commit.
When such a conflict occurs - we try to resolve the conflict. In many cases, such as when both transactions are inserting data into a table, we can retry the commit without having to rewrite any actual files.
During conflict resolution, we query the [`ducklake_snapshot_changes` table]({% link docs/stable/specification/catalog/tables.md %}#ducklake_snapshot_changes) to figure out the high-level set of changes that other snapshots have made in the meantime.

* If there are no logical conflicts between the changes that the snapshots have made - we automatically retry the transaction in the metadata catalog without rewriting any data files.
* If there are logical conflicts, we abort the transaction and instruct the user that conflicting changes have been made.

## Logical Conflicts

Below is a list of logical conflicts based on the snapshot's changeset. Snapshots conflict when any of the following conflicts occur:

### Schemas

* Both snapshots create a schema with the same name
* Both snapshots drop the same schema
* A snapshot tries to drop a schema in which another transaction created an entry

### Tables / Views

* Both snapshots create a table or view with the same name in the same schema
* A snapshot tries to create a table or view in a schema that was dropped by another snapshot
* Both snapshots drop the same table or view
* A snapshot tries to alter a table or view that was dropped or altered by another snapshot

### Data

* A snapshot tries to insert data into a table that was dropped or altered by another snapshot
* A snapshot tries to delete data from a table that was dropped, altered, deleted from or compacted by another snapshot

### Compaction

* A snapshot tries to compact a table that was deleted from by another snapshot
* A snapshot tries to compact a table that was dropped by another snapshot
