---
layout: docu
title: Sorted Tables
---

DuckLake tables can be configured with a sort order. When a sort order is defined, data is physically sorted by the specified columns whenever it is written out as Parquet — during `INSERT`, [file compaction]({% link docs/1.0/duckdb/maintenance/merge_adjacent_files.md %}), and [inlined data flushing]({% link docs/1.0/duckdb/advanced_features/data_inlining.md %}).

Sorting data before writing improves the effectiveness of min/max statistics at query time, which allows the DuckDB query engine to skip data files whose value ranges do not overlap with a query's filter predicates.

## Example Setup

The examples on this page use the following DuckLake instance:

```sql
ATTACH 'ducklake:sorted.duckdb' AS my_ducklake (DATA_PATH 'data/');
USE my_ducklake;
CREATE TABLE events (event_time TIMESTAMP, event_type VARCHAR, value DOUBLE);
```

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

### Expression-Based Sort Keys

Arbitrary expressions are supported in `SET SORTED BY`, not just column references. This includes function calls, casts, and [DuckLake macros]({% link docs/1.0/duckdb/advanced_features/macros.md %}).

Sort by the hour extracted from a timestamp:

```sql
ALTER TABLE events SET SORTED BY (date_trunc('hour', event_time) ASC);
```

Sort by a DuckLake macro:

```sql
CREATE MACRO event_bucket(t) AS date_trunc('day', t);
ALTER TABLE events SET SORTED BY (event_bucket(event_time) ASC);
```

Expressions are validated when `SET SORTED BY` is executed — an error is returned if any referenced columns or functions cannot be resolved.

## Removing a Sort Order

To remove the sort order from a table, use `RESET SORTED BY`:

```sql
ALTER TABLE events RESET SORTED BY;
```

After resetting, subsequent compactions and flushes will write data without sorting.

## Effect on Insert

By default, `INSERT` statements automatically sort data according to the table's sort order before writing Parquet files. This behavior is controlled by the [`sort_on_insert`]({% link docs/1.0/duckdb/usage/configuration.md %}) option, which defaults to `true`.

To disable sorting on insert (e.g., when insertion speed is the primary concern):

```sql
CALL my_ducklake.set_option('sort_on_insert', false, table_name => 'events');
```

When `sort_on_insert` is disabled, data written to Parquet during compaction and inlined data flushing is still sorted according to the table's sort order.

### Interaction with Data Inlining

When [data inlining]({% link docs/1.0/duckdb/advanced_features/data_inlining.md %}) is enabled and `sort_on_insert` is `false`, data that exceeds the inlining row limit is still sorted before being written to Parquet. Inlined data (which stays in the metadata catalog) is not sorted at insert time — it will be sorted when it is flushed.

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
