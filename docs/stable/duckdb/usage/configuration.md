---
layout: docu
title: Configuration
---

## `ducklake` Extension Configuration

The `ducklake` extension also allows for some configuration regarding retry mechanism for transaction conflicts.

| Name                                       | Description                                                                                               | Default |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------: |
| `ducklake_default_data_inlining_row_limit` | Default row limit for data inlining across all connections (0 disables inlining)                          |    `10` |
| `ducklake_default_version`                | Catalog version requested when `DUCKLAKE_VERSION` is not specified on `ATTACH` (`'1.0'` or `'1.1'`)        |  `NULL` |
| `ducklake_max_retry_count`                 | The maximum amount of retry attempts for a DuckLake transaction                                           |    `10` |
| `ducklake_retry_backoff`                   | Backoff factor for exponentially increasing retry wait time                                               |   `1.5` |
| `ducklake_retry_wait_ms`                   | Time between retries in ms                                                                                |   `100` |
| `ducklake_target_file_size`               | Target file size for insertion and compaction, overriding the persisted `target_file_size` option          |  `NULL` |
| `ducklake_write_deletion_vectors`          | **Experimental.** Write Iceberg V3 deletion vectors (puffin) instead of positional delete files (parquet) | `false` |

> Warning Deletion vectors are an experimental feature.

To set these configuration options, use the [`SET` statement](https://duckdb.org/docs/current/sql/statements/set):

```sql
SET ducklake_default_data_inlining_row_limit = 50;
SET ducklake_max_retry_count = 100;
SET ducklake_retry_backoff = 2;
SET ducklake_retry_wait_ms = 100;
SET ducklake_target_file_size = '256MB';
```

Use `RESET ducklake_target_file_size;` to return to the persisted setting.
When `ducklake_default_version` is `NULL`, new catalogs use 1.1 and existing 1.0 catalogs keep their version unless migration is requested.
See [“Upgrading to DuckLake 1.1”]({% link docs/stable/duckdb/migrations/upgrading_to_ducklake_1_1.md %}) for version selection.

## DuckLake-Specific Configuration

DuckLake supports persistent and scoped configuration operations.
These options can be set using the `set_option` function call or [table DDL](#table-options-in-ddl).
The options that have been set can be queried using the `options` function.
Configuration is persisted in the [`ducklake_metadata`]({% link docs/stable/specification/tables/ducklake_metadata.md %}) table.

### DuckLake-Specific Configuration Options

| Name                           | Description                                                                                               | Default  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | -------- |
| `auto_compact`                 | Whether compaction functions run on a table, including when the table is named explicitly | `true`   |
| `created_by`                   | Tool used to write the DuckLake                                                                           |          |
| `data_inlining_row_limit`      | Maximum amount of rows to inline in a single insert                                                       | `10`     |
| `data_path`                    | Path to data files                                                                                        |          |
| `delete_older_than`            | How old unused files must be to be removed by cleanup functions                                           |          |
| `encrypted`                    | Whether or not to encrypt Parquet files written to the data path                                          | `false`  |
| `expire_older_than`            | How old snapshots must be to be expired by default                                                        |          |
| `hive_file_pattern`            | If partitioned data should be written in a Hive-style folder structure                                    | `true`   |
| `parquet_compression_level`    | Compression level for Parquet files written with `zstd` (ignored for other codecs)                                                                      | `3`      |
| `parquet_compression`          | Compression algorithm for Parquet files (uncompressed, snappy, gzip, zstd, brotli, lz4, lz4_raw)          | `snappy` |
| `parquet_row_group_size_bytes` | Number of bytes per row group in Parquet files                                                            |          |
| `parquet_row_group_size`       | Number of rows per row group in Parquet files                                                             | `122880` |
| `parquet_version`              | Parquet format version (1 or 2)                                                                           | `1`      |
| `per_thread_output`            | Whether to create separate output files per thread during parallel insertion                              | `false`  |
| `require_commit_message`       | If an explicit commit message is required for a snapshot commit                                           | `false`  |
| `rewrite_delete_threshold`     | Minimum fraction of data removed from a file before a rewrite is warranted (0...1)                        | `0.95`   |
| `sort_on_insert`               | Whether to sort data on `INSERT` according to `SET SORTED BY`                                             | `true`   |
| `skip_stats_columns`           | Columns for which min/max bounds are not recorded (counts are still recorded)                             | `[]`     |
| `target_file_size`             | The target data file size for insertion and compaction operations                                         | `512 MiB` |
| `version`                      | DuckLake format version                                                                                   |          |
| `write_deletion_vectors`       | **Experimental.** Write Iceberg V3 deletion vectors (puffin) instead of positional delete files (parquet) | `false`  |

The `created_by`, `data_path`, `encrypted` and `version` values are reported by `options()` but cannot be changed with `set_option` or table DDL.
Configuration changes are not snapshot-versioned.

### Setting DuckLake-Specific Configuration Values

Set the global Parquet compression algorithm used when writing Parquet files:

```sql
CALL my_ducklake.set_option('parquet_compression', 'zstd');
```

Set the Parquet compression algorithm used for tables in a specific schema:

```sql
CALL my_ducklake.set_option('parquet_compression', 'zstd', schema => 'my_schema');
```

Set the Parquet compression algorithm used for a specific table:

```sql
CALL my_ducklake.set_option('parquet_compression', 'zstd', table_name => 'my_table');
```

See all options for the given attached DuckLake

```sql
FROM my_ducklake.options();
```

### Table Options in DDL

Options can also be set when creating a table:

```sql
CREATE TABLE my_ducklake.my_table (id INTEGER, payload VARCHAR)
WITH (parquet_compression = 'zstd', data_inlining_row_limit = 0);
```

For `CREATE TABLE AS`, place `WITH` before `AS` so the options apply to the initial write:

```sql
CREATE TABLE my_ducklake.copied_table
WITH (parquet_compression = 'gzip', data_inlining_row_limit = 0)
AS SELECT * FROM my_ducklake.my_table;
```

Use `ALTER TABLE` to set options or remove table overrides:

```sql
ALTER TABLE my_ducklake.my_table SET (target_file_size = '256MB');
ALTER TABLE my_ducklake.my_table RESET (target_file_size);
```

These statements use the same table-scoped options as `set_option`.
`RESET` restores the schema, global or default setting.
Use `WITH` or `ALTER TABLE ... SET` for a table created in the current transaction: `set_option` cannot target an uncommitted table or schema.

### Skipping Column Statistics

Use the table-only `skip_stats_columns` option to stop recording min/max bounds for selected columns:

```sql
CALL my_ducklake.set_option('skip_stats_columns', ['payload'], table_name => 'my_table');
```

Specify a column name or a list of top-level column names. Selecting a nested column also skips its fields.
Partition columns, `GEOMETRY`, `VARIANT` and nested columns containing these types cannot be selected.
To record bounds for future writes again, use `ALTER TABLE my_ducklake.my_table RESET (skip_stats_columns);`.
This does not backfill bounds for existing files.

### Scoping

Options can be set either globally, per-schema or per-table.
The most specific scope that is set is always used for any given setting, i.e., settings are used in the following priority:

| Priority | Setting Scope |
| -------: | ------------- |
|        1 | Table         |
|        2 | Schema        |
|        3 | Global        |
|        4 | Default       |

`skip_stats_columns` can only be set for a table.
`delete_older_than` and `expire_older_than` can only be set globally.
Set `require_commit_message` globally, since scoped values are not checked when committing.
Schema options apply directly to tables in that schema and are not inherited by [nested schemas]({% link docs/stable/duckdb/advanced_features/nested_schemas.md %}).
For a nested schema, use a dotted path, e.g., `schema => 'a.b'`.

The DuckDB setting `ducklake_target_file_size` overrides all persisted scopes.
For data inlining, persisted options take precedence over `DATA_INLINING_ROW_LIMIT` on `ATTACH`, which takes precedence over `ducklake_default_data_inlining_row_limit`.

> Note With a [Quack catalog]({% link docs/stable/duckdb/usage/choosing_a_catalog_database.md %}#quack), changes made by `set_option` are not undone by `ROLLBACK`.

## DuckLake Instance Settings

The `ducklake_settings` function returns metadata about a DuckLake instance: the catalog type, the extension version and the data path.

| Column              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `catalog_type`      | Metadata catalog backend (`duckdb`, `postgres`, `sqlite`, `quack`) |
| `extension_version` | Version of the `ducklake` extension                       |
| `data_path`         | Path where data files are stored                          |

```sql
FROM ducklake_settings('my_ducklake');
```

Using the convenience macro on an attached DuckLake:

```sql
FROM my_ducklake.settings();
```
