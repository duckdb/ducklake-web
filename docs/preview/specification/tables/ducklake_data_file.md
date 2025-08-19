---
layout: docu
title: ducklake_data_file
---

Data files contain the actual row data.

| Column name         | Column type |             |
| ------------------- | ----------- | ----------- |
| `data_file_id`      | `BIGINT`    | Primary Key |
| `table_id`          | `BIGINT`    |             |
| `begin_snapshot`    | `BIGINT`    |             |
| `end_snapshot`      | `BIGINT`    |             |
| `file_order`        | `BIGINT`    |             |
| `path`              | `VARCHAR`   |             |
| `path_is_relative`  | `BOOLEAN`   |             |
| `file_format`       | `VARCHAR`   |             |
| `record_count`      | `BIGINT`    |             |
| `file_size_bytes`   | `BIGINT`    |             |
| `footer_size`       | `BIGINT`    |             |
| `row_id_start`      | `BIGINT`    |             |
| `partition_id`      | `BIGINT`    |             |
| `encryption_key`    | `VARCHAR`   |             |
| `partial_file_info` | `VARCHAR`   |             |
| `mapping_id`        | `BIGINT`    |             |

- `data_file_id` is the numeric identifier of the file. It is a primary key. `data_file_id` is incremented from `next_file_id` in the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}).
- `table_id` refers to a `table_id` from the [`ducklake_table` table]({% link docs/stable/specification/tables/ducklake_table.md %}).
- `begin_snapshot` refers to a `snapshot_id` from the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}). The file is part of the table *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}). The file is part of the table *up to but not including* this snapshot id. If `end_snapshot` is `NULL`, the file is currently part of the table.
- `file_order` is a number that defines the vertical position of the file in the table. it needs to be unique within a snapshot but does not have to be strictly monotonic (holes are ok).
- `path` is the file path of the data file, e.g. `my_file.parquet` for a relative path.
- `path_is_relative` whether the `path` is relative to the [`path`]({% link docs/stable/specification/tables/ducklake_table.md %}) of the table (true) or an absolute path (false).
- `file_format` is the storage format of the file. Currently, only `parquet` is allowed.
- `record_count` is the number of records (row) in the file.
- `file_size_bytes` is the size of the file in Bytes.
- `footer_size` is the size of the file metadata footer, in the case of Parquet the Thrift data. This is an optimization that allows for faster reading of the file.
- `row_id_start` is the first logical row id in the file. (Every row has a unique row-id that is maintained.)
- `partition_id` refers to a `partition_id` from the `ducklake_partition_info` table.
- `encryption_key` contains the encryption for the file if [encryption]({% link docs/stable/duckdb/advanced_features/encryption.md %}) is enabled.
- `partial_file_info` is used when snapshots refer to parts of a file.
- `mapping_id` refers to a `mapping_id` from the [`ducklake_column_mapping` table]({% link docs/stable/specification/tables/ducklake_column_mapping.md %})
