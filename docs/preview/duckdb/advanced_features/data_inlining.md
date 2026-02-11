---
layout: docu
title: Data Inlining
---

When writing small changes to DuckLake, it can be wasteful to write each changeset to an individual Parquet file.
DuckLake supports directly writing small changes to the metadata using _data inlining_.
Instead of writing a Parquet file to the data storage and then writing a reference to that file in the metadata catalog, we directly write the rows to inlined data tables within the metadata catalog.

Data inlining can be enabled in two ways:

Using the `DATA_INLINING_ROW_LIMIT` attach parameter. This is bounded to your DuckLake connection, so if you detach and reattach without the parameter, data inlining won't be used.

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake (DATA_INLINING_ROW_LIMIT 10);
```

Using the option `data_inlining_row_limit` which can be set at the table, schema or global level. This is persisted in the `ducklake_metadata` table and will be reused across connections.

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake;
USE my_ducklake;
CREATE TABLE t (a INT);
CALL my_ducklake.set_option('data_inlining_row_limit', 10, table_name => 't');
```

When enabled, any inserts that write fewer than the given amount of rows are automatically written to inlined tables instead.

Inlined data behaves exactly the same as data written to Parquet files.
The only difference is that the inlined data lives in the metadata catalog, instead of in Parquet files in the data path.

For example, when inserting a low number of rows, data is automatically inlined:

```sql
CREATE TABLE my_ducklake.tbl (col INTEGER);
-- Inserting 3 rows, data is inlined
INSERT INTO my_ducklake.tbl VALUES (1), (2), (3);
-- No Parquet files exist
SELECT count(*) FROM glob('inlining.duckdb.files/**');
```

```text
┌──────────────┐
│ count_star() │
│    int64     │
├──────────────┤
│      0       │
└──────────────┘
```

When inserting more data than the `DATA_INLINING_ROW_LIMIT`, inserts are automatically written to Parquet:

```sql
INSERT INTO my_ducklake.tbl FROM range(100);
SELECT count(*) FROM glob('inlining.duckdb.files/**');
```

```text
┌──────────────┐
│ count_star() │
│    int64     │
├──────────────┤
│      1       │
└──────────────┘
```

## Flushing Inlined Data

Inlined data can be manually flushed to Parquet files by calling the `ducklake_flush_inlined_data` function.

Flush all inlined data in all schemas and tables:

```sql
CALL ducklake_flush_inlined_data('my_ducklake');
```

Flush inlined data only within a specific schema:

```sql
CALL ducklake_flush_inlined_data(
    'my_ducklake',
    schema_name => 'my_schema'
);
```

Flush inlined data for a specific table in the default `main` schema:

```sql
CALL ducklake_flush_inlined_data(
    'my_ducklake',
    table_name => 'my_table'
);
```

Flush inlined data for a specific table in a specific schema:

```sql
CALL ducklake_flush_inlined_data(
    'my_ducklake',
    schema_name => 'my_schema',
    table_name => 'my_table'
);
```
