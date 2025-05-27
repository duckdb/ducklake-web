---
layout: docu
title: ducklake_file_column_statistics
---

This table contains column-level statistics for a single data file.

| Column name         | Column type |             |
| ------------------- | ----------- | ----------- |
| `data_file_id`      | `BIGINT`    |             |
| `table_id`          | `BIGINT`    |             |
| `column_id`         | `BIGINT`    |             |
| `column_size_bytes` | `BIGINT`    |             |
| `value_count`       | `BIGINT`    |             |
| `null_count`        | `BIGINT`    |             |
| `nan_count`         | `BIGINT`    |             |
| `min_value`         | `VARCHAR`   |             |
| `max_value`         | `VARCHAR`   |             |
| `contains_nan`      | `BOOLEAN`   |             |

- `data_file_id` refers to a `data_file_id` from the `ducklake_data_file` table. 
- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `column_id` refers to a `column_id` from the `ducklake_column` table. 
- `column_size_bytes` is the byte size of the column.
- `value_count` is the number of values in the column. This does not have to correspond to the number of records in the file for nested types.
- `null_count` is the number of values in the column that are `NULL`.
- `nan_count` is the number of values in the column that are `NaN`. This is only relevant for floating-point types.
- `min_value` contains the minimum value for the column, encoded as a string. This does not have to be exact but has to be a lower bound. The value has to be cast to the actual type for accurate comparision, e.g. on integer types. 
- `max_value` contains the maximum value for the column, encoded as a string. This does not have to be exact but has to be an upper bound. The value has to be cast to the actual type for accurate comparision, e.g. on integer types. 
- `contains_nan` is a flag whether the column contains any `NaN` values. This is only relevant for floating-point types.
