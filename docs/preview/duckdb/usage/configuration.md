---
layout: docu
title: Configuration
---

## DuckLake Extension Configuration

The DuckLake extension also allows for some configuration regarding retry mechanism for transaction conflicts. 

### Option List

| Name                     | Description                                                     | Default |
|--------------------------|-----------------------------------------------------------------|---------|
| ducklake_max_retry_count | The maximum amount of retry attempts for a ducklake transaction | 10      |
| ducklake_retry_wait_ms   | Time between retries in ms                                      | 100     |
| ducklake_retry_backoff   | Backoff factor for exponentially increasing retry wait time     | 1.5     |

### Setting Config Values

```sql
SET ducklake_max_retry_count = 100
SET ducklake_retry_wait_ms = 100
SET ducklake_retry_backoff = 2
```

## Ducklake Specific Configuration

DuckLake supports persistent and scoped configuration operations.
These options can be set using the `set_option` function.
The options that have been set can be queried using the `options` function.
Configuration is persisted in the [`ducklake_metadata`](../../specification/tables/ducklake_metadata) table

### Option List

|             Name             |                                       Description                                                | Default |
|------------------------------|--------------------------------------------------------------------------------------------------|---------|
| data_inlining_row_limit      | Maximum amount of rows to inline in a single insert                                              | 0       |
| parquet_compression          | Compression algorithm for Parquet files (uncompressed, snappy, gzip, zstd, brotli, lz4, lz4_raw) | snappy  |
| parquet_version              | Parquet format version (1 or 2)                                                                  | 1       |
| parquet_compression_level    | Compression level for Parquet files                                                              | 3       |
| parquet_row_group_size       | Number of rows per row group in Parquet files                                                    | 122 880 |
| parquet_row_group_size_bytes | Number of bytes per row group in Parquet files                                                   |         |
| target_file_size             | The target data file size for insertion and compaction operations                                | 512MB   |
| per_thread_output            | Whether to create separate output files per thread during parallel insertion                      | false   |
| hive_file_pattern            | Whether partitioned data should be written following a hive-style partition                      | true    |

### Setting Config Values

```sql
-- set the global parquet compression algorithm used when writing Parquet files
CALL my_ducklake.set_option('parquet_compression', 'zstd');
-- set the parquet compression algorithm used for tables in a specific schema
CALL my_ducklake.set_option('parquet_compression', 'zstd', schema => 'my_schema');
-- set the parquet compression algorithm used for a specific table
CALL my_ducklake.set_option('parquet_compression', 'zstd', table_name => 'my_table');

-- see all options for the given attached DuckLake
FROM my_ducklake.options();
```

### Scoping

Options can be set either globally, per-schema or per-table.
The most specific scope that is set is always used for any given setting, i.e., settings are used in the following priority:

| Priority | Setting Scope |
|---------:|---------------|
| 1        | Table         |
| 2        | Schema        |
| 3        | Global        |
| 4        | Default       |
