---
layout: docu
title: Data Inlining
---

> Data Inlining is currently experimental. It needs to be enabled explicitly and is only supported for DuckDB databases. We are planning to improve support for this feature in the future.

When writing small changes to DuckLake, it can be wasteful to write each changeset to an individual Parquet file.
DuckLake supports directly writing small changes to the metadata using Data Inlining.
Instead of writing a Parquet file to the data storage and then writing a reference to that file in the metadata catalog, we directly write the rows to inlined data tables within the metadata catalog.

Data inlining must be enabled explicitly using the `DATA_INLINING_ROW_LIMIT` attach parameter.
When enabled, any inserts that write fewer than the given amount of rows are automatically written to inlined tables instead.

```sql
ATTACH 'ducklake:inlining.db' (DATA_INLINING_ROW_LIMIT 10);
``` 

Inlined data behaves exactly the same as data written to Parquet files.
The inlined data can be queried, updated and deleted, and the schema of inlined data can be modified.  
The only difference is that the inlined data lives in the metadata catalog, instead of in Parquet files in the data path.

For example, when inserting a low number of rows, data is automatically inlined:

```sql
CREATE TABLE inlining.tbl(col INTEGER);
-- inserting 3 rows, data is inlined
INSERT INTO inlining.tbl VALUES (1), (2), (3);
-- no Parquet files exist
SELECT COUNT(*) FROM glob('inlining.db.files/**');
```
```
┌──────────────┐
│ count_star() │
│    int64     │
├──────────────┤
│      0       │
└──────────────┘
```

When inserting more data than the `DATA_INLINING_ROW_LIMIT`, inserts are automatically written to Parquet:

```sql
INSERT INTO inlining.tbl FROM range(100);
SELECT COUNT(*) FROM glob('inlining.db.files/**');
```
```
┌──────────────┐
│ count_star() │
│    int64     │
├──────────────┤
│      1       │
└──────────────┘
```

### Flushing Inlined Data

Inlined data can be manually flushed to parquet files by calling the `ducklake_flush_inlined_data` function. For example:

```sql
-- flush all inlined data in all schemas and tables
CALL ducklake_flush_inlined_data('my_ducklake');
-- flush inlined data only within a specific schema
CALL ducklake_flush_inlined_data('my_ducklake', schema_name => 'my_schema');
-- flush inlined data for a specific table in the default 'main' schema
CALL ducklake_flush_inlined_data('my_ducklake', table_name => 'my_table');
-- flush inlined data for a specific table in a specific schema
CALL ducklake_flush_inlined_data('my_ducklake', schema_name => 'my_schema', table_name => 'my_table');
```
