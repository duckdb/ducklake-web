---
layout: docu
title: Sorted Tables
---

DuckLake tables can be configured with a sort order.
By default, when a sort order is defined, data is physically sorted by the specified columns whenever it is written out as Parquet (during `INSERT`, [file compaction]({% link docs/stable/duckdb/maintenance/merge_adjacent_files.md %}), and [inlined data flushing]({% link docs/stable/duckdb/advanced_features/data_inlining.md %})).

Sorting data before writing improves the effectiveness of min/max statistics at query time, which allows the DuckDB query engine to skip data files whose value ranges do not overlap with a query's filter predicates.

## Example Setup

The examples on this page use the following DuckLake instance:

```sql
ATTACH 'ducklake:sorted.duckdb' AS my_ducklake (DATA_PATH 'data/');
USE my_ducklake;
CREATE TABLE events (event_time TIMESTAMP, event_type VARCHAR, value DOUBLE);
```

A sort order can also be defined in `CREATE TABLE`, optionally combined with [partitioning]({% link docs/stable/duckdb/advanced_features/partitioning.md %}):

```sql
CREATE TABLE partitioned_events (event_time TIMESTAMP, event_type VARCHAR, value DOUBLE)
    PARTITIONED BY (epoch_day(event_time))
    SORTED BY (event_time, event_type);
```

For `CREATE TABLE AS SELECT`, place the sort clause before `AS`:

```sql
CREATE TABLE sorted_events SORTED BY (event_time, event_type) AS
    SELECT * FROM events;
```

The `PARTITIONED BY` and `SORTED BY` clauses can appear in either order.
In `CREATE TABLE`, sort keys use ascending order with nulls last.
Direction and null-order modifiers require `ALTER TABLE ... SET SORTED BY`.

## Setting a Sort Order

Set the sort order for a table using `SET SORTED BY`:

```sql
ALTER TABLE events SET SORTED BY (event_time ASC);
```

Multiple sort keys are supported:

```sql
ALTER TABLE events SET SORTED BY (event_time ASC, event_type DESC);
```

`ASC` and `DESC` control the sort direction. `NULLS FIRST` and `NULLS LAST` are also supported to control null ordering:

```sql
ALTER TABLE events SET SORTED BY (event_time ASC NULLS LAST);
```

Setting the same sort order again is a no-op and does not create a snapshot.
Columns used in sort keys cannot be dropped until the sort order is reset or changed to exclude them.

### Expression-Based Sort Keys

Scalar expressions are supported in `SET SORTED BY`, not just column references. This includes function calls, casts, and [DuckLake macros]({% link docs/stable/duckdb/advanced_features/macros.md %}).

Sort by the hour extracted from a timestamp:

```sql
ALTER TABLE events SET SORTED BY (date_trunc('hour', event_time) ASC);
```

Sort by a DuckLake macro:

```sql
CREATE MACRO event_bucket(t) AS date_trunc('day', t);
ALTER TABLE events SET SORTED BY (event_bucket(event_time) ASC);
```

Column references are validated when `SET SORTED BY` is executed.
An error is returned if any referenced columns cannot be resolved.
Functions and macros are resolved when data is written, compacted, or flushed.
Subqueries, window functions, and aggregate functions are not supported as sort keys.
`SET SORTED BY` accepts them, but writes, compactions, and flushes of the table then fail until the sort order is changed or reset.

## Removing a Sort Order

To remove the sort order from a table, use `RESET SORTED BY`:

```sql
ALTER TABLE events RESET SORTED BY;
```

After resetting, subsequent compactions and flushes will write data without sorting.
Resetting a table that has no sort order is a no-op.

## Effect on Insert

By default, `INSERT` statements automatically sort data according to the table's sort order before writing Parquet files. This behavior is controlled by the [`sort_on_insert`]({% link docs/stable/duckdb/usage/configuration.md %}) option, which defaults to `true`.

To disable sorting on insert (e.g., when insertion speed is the primary concern):

```sql
CALL my_ducklake.set_option('sort_on_insert', false, table_name => 'events');
```

When `sort_on_insert` is disabled, data written to Parquet during compaction and inlined data flushing is still sorted according to the table's sort order.

### Interaction with Data Inlining

When [data inlining]({% link docs/stable/duckdb/advanced_features/data_inlining.md %}) is enabled and `sort_on_insert` is `false`, data that exceeds the inlining row limit is still sorted before being written to Parquet. Inlined data (which stays in the metadata catalog) is not sorted at insert time — it will be sorted when it is flushed.

## Effect on Compaction and Flush

Once a sort order is set, the **current** sort order is applied at the time of compaction or flush — not the sort order that was active when the source data was written.

When `ducklake_merge_adjacent_files` runs on a sorted table, the merged output file is sorted:

```sql
ALTER TABLE events SET SORTED BY (event_time ASC);
CALL ducklake_merge_adjacent_files('my_ducklake', 'events');
```

The same applies when flushing inlined data:

```sql
CALL ducklake_flush_inlined_data('my_ducklake', table_name => 'events');
```
