---
layout: docu
title: Data Inlining
---

When writing small changes to DuckLake, it can be wasteful to write each changeset to an individual Parquet file.
DuckLake supports directly writing small changes to the metadata using _data inlining_.
Instead of writing a Parquet file to the data storage and then writing a reference to that file in the metadata catalog, DuckLake writes the data directly to tables within the metadata catalog.

Data inlining applies to both inserts and deletes:

* **Insertion inlining** – small inserts are written to a per-table inlined data table instead of a new Parquet data file.
* **Deletion inlining** – small deletes from existing Parquet data files are written to a per-table inlined deletion table instead of a new Parquet delete file.

For queries, inlined data behaves the same as data written to Parquet files. It lives in the metadata catalog rather than in Parquet files in the data path.

## Configuring Data Inlining

Data inlining is enabled by default with a row limit of 10. Eligible inserts of at most `data_inlining_row_limit` rows are automatically written to inlined tables instead of Parquet files.
For deletes from Parquet files, the limit applies to the number of rows that a single statement deletes from each data file.

### Global Default

The global default row limit is controlled by the `ducklake_default_data_inlining_row_limit` DuckDB setting. This applies to all DuckLake connections that do not have an explicit `data_inlining_row_limit` configured:

```sql
-- Change the default row limit to 50 rows
SET ducklake_default_data_inlining_row_limit = 50;

-- Disable data inlining by default
SET ducklake_default_data_inlining_row_limit = 0;
```

### Per-Attach Override

The `DATA_INLINING_ROW_LIMIT` parameter of the `ATTACH` statement overrides the default for the attached catalog. This setting is not persisted and must be specified on each attach:

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake (DATA_INLINING_ROW_LIMIT 10);
```

### Persistent Override

The `data_inlining_row_limit` option can be persisted in the DuckLake metadata at the table, schema, or global level. A persisted value takes priority over both the global DuckDB default and the ATTACH parameter:

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake;
USE my_ducklake;
CREATE TABLE t (a INT);
CALL my_ducklake.set_option('data_inlining_row_limit', 10, table_name => 't');
```

The table-level option can also be set in `CREATE TABLE`, including `CREATE TABLE AS SELECT`, or changed using `ALTER TABLE`:

```sql
CREATE TABLE events (event_id INTEGER) WITH (data_inlining_row_limit = 100);
CREATE TABLE initial_events WITH (data_inlining_row_limit = 100) AS
    SELECT 1 AS event_id;

ALTER TABLE events SET (data_inlining_row_limit = 50);
ALTER TABLE events RESET (data_inlining_row_limit);
```

Resetting the table option removes that override.
Changing the limit affects subsequent writes.
It does not flush existing inlined data.

## Insertion Inlining

When insertion inlining is enabled, small inserts are stored directly in the metadata catalog instead of creating a new Parquet data file. DuckLake automatically creates and manages a per-table inlined data table with the following structure:

```sql
-- created and managed internally by DuckLake; one table per schema version
ducklake_inlined_data_⟨table_id⟩_⟨schema_version⟩ (
    _ducklake_row_id         BIGINT,
    _ducklake_begin_snapshot BIGINT,
    _ducklake_end_snapshot   BIGINT,
    -- one column per table column, matching the table schema
    ...
)
```

In DuckLake format version 1.0, these columns are named `row_id`, `begin_snapshot`, and `end_snapshot`.

`_ducklake_begin_snapshot` is the snapshot in which the row was inserted. `_ducklake_end_snapshot` is the snapshot in which the row was deleted, or `NULL` if the row is still live. Deletions of committed inlined rows are recorded by setting `_ducklake_end_snapshot` rather than creating a separate inlined deletion entry.
Inlined data tables are associated with table schema versions, so rows written before and after a column is added or dropped can use different inlined tables.

In DuckLake format version 1.1, the `_ducklake_` prefix is reserved for internal column names, even when inlining is disabled.
User columns named `row_id`, `begin_snapshot`, and `end_snapshot` can be inlined with DuckLake format version 1.1.

For example, when inserting a low number of rows, data is automatically inlined:

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake (DATA_INLINING_ROW_LIMIT 10);
USE my_ducklake;

CREATE TABLE tbl (col INTEGER);
-- Inserting 3 rows – below the threshold, data is inlined
INSERT INTO tbl VALUES (1), (2), (3);
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

When inserting more rows than the `DATA_INLINING_ROW_LIMIT`, inserts are automatically written to Parquet:

```sql
INSERT INTO tbl FROM range(100);
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

Small inserts performed by `MERGE INTO`, including a merge with only a `WHEN NOT MATCHED THEN INSERT` branch, can also be inlined:

```sql
MERGE INTO tbl AS target
USING (VALUES (100)) AS source(col)
    ON target.col = source.col
WHEN NOT MATCHED THEN INSERT (col) VALUES (source.col);
```

## Deletion Inlining

When deletion inlining is enabled, deletes affecting at most `DATA_INLINING_ROW_LIMIT` rows in an existing Parquet data file are stored directly in the metadata catalog instead of creating a Parquet delete file. DuckLake automatically creates and manages a per-table inlined deletion table with the following structure:

```sql
-- created and managed internally by DuckLake; one table per DuckLake table
ducklake_inlined_delete_⟨table_id⟩ (
    file_id        BIGINT,
    row_id         BIGINT,
    begin_snapshot BIGINT
)
```

`file_id` is the ID of the Parquet data file containing the deleted row, `row_id` is the position of the deleted row within that file, and `begin_snapshot` is the snapshot in which the deletion occurred.

> Deletion inlining only applies to rows in existing Parquet data files. Deletes that target committed inlined insert rows are handled by setting `_ducklake_end_snapshot` on the inlined insert row and do not create an inlined deletion entry.

For example, with deletion inlining enabled, a small delete produces no new Parquet delete file:

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake (DATA_INLINING_ROW_LIMIT 10);
USE my_ducklake;

CREATE TABLE tbl (col INTEGER);
-- Insert enough rows to exceed the threshold, so they go to Parquet
INSERT INTO tbl FROM range(100);

-- Delete 2 rows – below the threshold, stored inline
DELETE FROM tbl WHERE col < 2;
-- No new delete file is created
SELECT count(*) FROM glob('inlining.duckdb.files/**/*.parquet') WHERE file LIKE '%-delete.parquet';
```

## ALTER TABLE Support

The following `ALTER TABLE` operations are supported within a transaction that also contains inlined data:

* `ADD COLUMN`
* `DROP COLUMN`
* `RENAME TABLE`
* `RENAME COLUMN`
* `ALTER COLUMN TYPE`
* `SET NOT NULL` / `DROP NOT NULL`

## Metadata Catalog Support

Data inlining is supported when using DuckDB, PostgreSQL, SQLite, or Quack as the metadata catalog.
DuckDB and Quack store inlined data using native DuckDB types.

When using PostgreSQL or SQLite as the metadata catalog, nested types (`STRUCT`, `MAP`, and `LIST`) are stored as `VARCHAR` strings in the inlined data table. DuckLake automatically casts the values back to the correct type when reading.

Inlining of `VARIANT` columns is supported with DuckDB and Quack, and with PostgreSQL and SQLite when using DuckLake format version 1.1.
PostgreSQL and SQLite use a binary encoding that preserves type information, including for `VARIANT` fields nested inside `STRUCT`, `MAP`, or `LIST` values.

> Warning DuckDB cannot write SQL types such as `STRUCT(v VARIANT)` or `VARIANT[]` to Parquet, so flushing them, running `CHECKPOINT`, or exceeding the inlining limit fails.
> Top-level `VARIANT` columns can contain object and array values.

Tables that cannot use insertion inlining because of unsupported types or metadata catalog limits are written to files instead.
DuckLake emits a [warning]({% link docs/stable/duckdb/advanced_features/logging.md %}) explaining why.

## Flushing Inlined Data

Inlined data — both inlined inserts and inlined deletions — can be manually flushed to Parquet files by calling the `ducklake_flush_inlined_data` function.
The experimental `write_deletion_vectors` option uses [Puffin deletion-vector files]({% link docs/stable/duckdb/advanced_features/deletion_vectors.md %}) for deletions instead.

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

### Return Values

`ducklake_flush_inlined_data` returns one row per table that had inlined rows flushed, with the following columns:

| Column         | Type      | Description                                            |
| -------------- | --------- | ------------------------------------------------------ |
| `schema_name`  | `VARCHAR` | Name of the schema containing the table                |
| `table_name`   | `VARCHAR` | Name of the table                                      |
| `rows_flushed` | `HUGEINT` | Number of rows flushed from inlined storage to Parquet |

Flushing only inlined deletion entries can create delete files without returning a row.

Tables with no inlined data are not included in the result. Example:

```sql
SELECT schema_name, table_name, rows_flushed
FROM ducklake_flush_inlined_data('my_ducklake');
```

### Time Travel and Deletions

When flushing inlined inserts that have had rows deleted, DuckLake creates materialized Parquet data files and a *partial deletion file* for each data file containing deleted rows. Rather than creating one deletion file per delete snapshot, the partial deletion file consolidates all deletions into a single Parquet file with an extra column that records the snapshot in which each row was deleted. This preserves full time-travel support while keeping the number of files minimal.

By default, when flushing inlined deletions (rows deleted from existing Parquet data files), DuckLake writes a Parquet delete file for each affected data file. If a delete file already exists for that data file, the inlined deletions are merged into it. The resulting file is always a partial deletion file so that snapshot information is preserved for time-travel queries.

For example:

```sql
ATTACH 'ducklake:inlining.duckdb' AS my_ducklake (DATA_PATH 'data/', DATA_INLINING_ROW_LIMIT 10);
USE my_ducklake;

CREATE TABLE t1 (a INTEGER);
INSERT INTO t1 VALUES (1), (2), (3), (4), (5), (6), (7), (8);

DELETE FROM t1 WHERE a = 2;
DELETE FROM t1 WHERE a = 5;

-- Flush materializes data to Parquet and creates a deletion file with snapshot information
CALL ducklake_flush_inlined_data('my_ducklake');
```

After flushing, time travel to snapshots before the deletions still returns the deleted rows:

```sql
-- Returns all 8 original rows
SELECT * FROM t1 AT (VERSION => 2);
```

[Expiring snapshots]({% link docs/stable/duckdb/maintenance/expire_snapshots.md %}) removes deleted inlined rows that no retained snapshot can read.

### Sorted Flush

If a table has a [sort order defined]({% link docs/stable/duckdb/advanced_features/sorted_tables.md %}), `ducklake_flush_inlined_data` sorts the output by those keys before writing the resulting Parquet file. The sort order applied is the one currently active on the table at the time of the flush.

### Interaction with `auto_compact`

If a table has `auto_compact` set to `false`, `ducklake_flush_inlined_data` will skip it, including when `table_name` explicitly names the table. The same applies when flushing via `CHECKPOINT`, since `CHECKPOINT` calls `ducklake_flush_inlined_data` internally.

> `auto_compact` does not cause flushing to happen automatically after writes. It only determines whether a table is eligible for flushing when a maintenance function is called.
