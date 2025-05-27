---
layout: docu
title: ducklake_delete_file
---

Delete files contains the row ids of rows that are deleted. Each data file will have its own delete file if any deletes are present for this data file.

| Column name        | Column type |             |
| ------------------ | ----------- | ----------- |
| `delete_file_id`   | `BIGINT`    | Primary Key |
| `table_id`         | `BIGINT`    |             |
| `begin_snapshot`   | `BIGINT`    |             |
| `end_snapshot`     | `BIGINT`    |             |
| `data_file_id`     | `BIGINT`    |             |
| `path`             | `VARCHAR`   |             |
| `path_is_relative` | `BOOLEAN`   |             |
| `format`           | `VARCHAR`   |             |
| `delete_count`     | `BIGINT`    |             |
| `file_size_bytes`  | `BIGINT`    |             |
| `footer_size`      | `BIGINT`    |             |
| `encryption_key`   | `VARCHAR`   |             |

- `delete_file_id` is the numeric identifier of the delete file. It is a primary key. `delete_file_id` is incremented from `next_file_id` in the `ducklake_snapshot` table.
- `table_id` refers to a `table_id` from the `ducklake_table` table.
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The delete file is part of the table *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The delete file is part of the table *until* this snapshot id. If `end_snapshot` is `NULL`, the delete file is currently part of the table.
- `data_file_id` refers to a `data_file_id` from the `ducklake_data_file` table.
- `path` is the file name of the delete file, e.g. `my_file-deletes.parquet`. The file name is either relative to the `data_path` value in `ducklake_metadata` or absolute. If relative, the `path_is_relative` field is set to `true`.
- `path_is_relative` defines whether the path is absolute or relative, see above.
- `format` is the storage format of the delete file. Currently, only `parquet` is allowed.
- `delete_count` is the number of deletion records in the file.
- `file_size_bytes` is the size of the file in Bytes.
- `footer_size` is the size of the file metadata footer, in the case of Parquet the Thrift data. This is an optimization that allows for faster reading of the file.
- `encryption_key` contains the encryption for the file if [encryption]({% link docs/stable/duckdb/advanced_features/encryption.md %}) is enabled.
