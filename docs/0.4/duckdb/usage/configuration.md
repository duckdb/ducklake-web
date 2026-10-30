---
layout: docu
title: Configuration
---

## `ducklake` Extension Configuration

The `ducklake` extension also allows for some configuration regarding retry mechanism for transaction conflicts.

### Option List

| Name                                       | Description                                                                  | Default |
| ------------------------------------------ | ---------------------------------------------------------------------------- | ------: |
| `ducklake_max_retry_count`                 | The maximum amount of retry attempts for a DuckLake transaction              |      10 |
| `ducklake_retry_wait_ms`                   | Time between retries in ms                                                   |     100 |
| `ducklake_retry_backoff`                   | Backoff factor for exponentially increasing retry wait time                  |     1.5 |
| `ducklake_default_data_inlining_row_limit` | Default row limit for data inlining across all connections (0 disables inlining) |      10 |

### Setting Config Values

```sql
SET ducklake_max_retry_count = 100;
SET ducklake_retry_wait_ms = 100;
SET ducklake_retry_backoff = 2;
SET ducklake_default_data_inlining_row_limit = 50;
```

## DuckLake Specific Configuration

DuckLake supports persistent and scoped configuration operations.
These options can be set using the `set_option` function.
The options that have been set can be queried using the `options` function.
Configuration is persisted in the [`ducklake_metadata`]({% link docs/0.4/specification/tables/ducklake_metadata.md %}) table.

### Option List

| Name                           | Description                                                                                      | Default  |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | -------- |
| `data_inlining_row_limit`      | Maximum amount of rows to inline in a single insert                                              | `10`     |
| `parquet_compression`          | Compression algorithm for Parquet files (uncompressed, snappy, gzip, zstd, brotli, lz4, lz4_raw) | `snappy` |
| `parquet_version`              | Parquet format version (1 or 2)                                                                  | `1`      |
| `parquet_compression_level`    | Compression level for Parquet files                                                              | `3`      |
| `parquet_row_group_size`       | Number of rows per row group in Parquet files                                                    | `122880` |
| `parquet_row_group_size_bytes` | Number of bytes per row group in Parquet files                                                   |          |
| `hive_file_pattern`            | If partitioned data should be written in a Hive-style folder structure                           | `true`   |
| `target_file_size`             | The target data file size for insertion and compaction operations                                | `512MB`  |
| `version`                      | DuckLake format version                                                                          |          |
| `created_by`                   | Tool used to write the DuckLake                                                                  |          |
| `data_path`                    | Path to data files                                                                               |          |
| `require_commit_message`       | If an explicit commit message is required for a snapshot commit.                                 | `false`  |
| `rewrite_delete_threshold`     | Minimum fraction of data removed from a file before a rewrite is warranted (0...1)               | `0.95`   |
| `delete_older_than`            | How old unused files must be to be removed by cleanup functions                                  |          |
| `expire_older_than`            | How old snapshots must be to be expired by default                                               |          |
| `auto_compact`                 | Whether a table is included when compaction functions are called without a specific table argument | `true`   |
| `encrypted`                    | Whether or not to encrypt Parquet files written to the data path                                 | `false`  |
| `per_thread_output`            | Whether to create separate output files per thread during parallel insertion                     | `false`  |

### Setting Config Values

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

### Scoping

Options can be set either globally, per-schema, or per-table.
The most specific scope that is set is always used for any given setting, i.e., settings are used in the following priority:

| Priority | Setting Scope |
| -------: | ------------- |
|        1 | Table         |
|        2 | Schema        |
|        3 | Global        |
|        4 | Default       |

## DuckLake Instance Settings

The `ducklake_settings` function returns metadata about a DuckLake instance: the catalog type, the extension version, and the data path.

| Column              | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `catalog_type`      | Metadata catalog backend (`duckdb`, `postgres`, `sqlite`) |
| `extension_version` | Version of the `ducklake` extension                      |
| `data_path`         | Path where data files are stored                         |

```sql
FROM ducklake_settings('my_ducklake');
```

Using the convenience macro on an attached DuckLake:

```sql
FROM my_ducklake.settings();
```
