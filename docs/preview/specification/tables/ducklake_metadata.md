---
layout: docu
title: ducklake_metadata
---

The `ducklake_metadata` table contains key/value pairs with information about the specific setup of the DuckLake catalog.

| Column name | Column type |             |
| ----------- | ----------- | ----------- |
| `key`       | `VARCHAR`   | Not `NULL`  |
| `value`     | `VARCHAR`   | Not `NULL`  |
| `scope`     | `VARCHAR`   |             |
| `scope_id`  | `BIGINT`    |             |

- `key` is an arbitrary key string. See below for a list of pre-defined keys. The key can't be `NULL`.
- `value` is the arbitrary value string.
- `scope` defines the scope of the setting.
- `scope_id` is the id of the item that the setting is scoped to (see the table below) or `NULL` for the Global scope.

| Scope          | `scope` | Description                                                            |
| -------------- | ------- | ---------------------------------------------------------------------- |
| Global         | `NULL`  | The scope of the setting is global for the entire catalog.             |
| Schema         | `schema`| The setting is scoped to the `schema_id` referenced by `scope_id`.     |
| Table          | `table` | The setting is scoped to the `table_id` referenced by `scope_id`.      |

Currently, the following values for `key` are specified:

| Name             | Description                                                                               | Notes              | Scope(s)      |
| ---------------- | ----------------------------------------------------------------------------------------- | ------------------ | ----------- |
| `version`        | The DuckLake schema version.                                                              |                    | Global      |
| `table`          | A string that identifies which program wrote the schema, e.g., `DuckDB v1.3.2`            |                    | Global      |
| `data_path`      | The data path prefix for reading and writing data files, e.g., `s3://mybucket/myprefix/`  | Has to end in `/`  | Global      |
| `encrypted`     | A boolean that specifies whether data files are encrypted or not.  | `'true'` or `'false'`  | Global      |
| `data_inlining_row_limit`      | The maximum amount of rows to inline in a single insert    |   | Global, Schema or Table      |
| `target_file_size`      | The size in bytes to limit a parquet file at for insert and compaction operations   |   | Global, Schema or Table      |
| `parquet_row_group_size_bytes` | The size in bytes to limit a parquet file rowgroup at for insert and compaction operations | | Global, Schema or Table |
| `parquet_row_group_size` | The size in number of rows to limit a parquet file rowgroup at for insert and compaction operations | | Global, Schema or Table |
| `parquet_compression` | The compression used to write parquet files e.g., `zstd` | `uncompressed`, `snappy`, `gzip`, `zstd`, `brotli`, `lz4`, `lz4_raw` | Global, Schema or Table |
| `parquet_compression_level` | The compression level used for the selected `parquet_compression` | | Global, Schema or Table |
| `parquet_version` | The version of the Parquet standard used to write parquet files | `1` or `2` | Global, Schema or Table |
| `per_thread_output` | Whether to create separate output files per thread during parallel insertion | | Global, Schema or Table |
