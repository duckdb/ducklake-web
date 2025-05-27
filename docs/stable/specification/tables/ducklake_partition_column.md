---
layout: docu
title: ducklake_partition_column
---

Partitions can refer to one or more columns, possibly with transformations such as hashing or bucketing.

| Column name           | Column type |             |
| --------------------- | ----------- | ----------- |
| `partition_id`        | `BIGINT`    |             |
| `table_id`            | `BIGINT`    |             |
| `partition_key_index` | `BIGINT`    |             |
| `column_id`           | `BIGINT`    |             |
| `transform`           | `VARCHAR`   |             |

- `partition_id` refers to a `partition_id` from the `ducklake_partition_info` table. 
- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `partition_key_index` defines where in the partition key the column is. For example, in a partitioning by (`a`, `b`, `c`) the `partition_key_index` of `b` would be `1`.
- `column_id` refers to a `column_id` from the `ducklake_column` table. 
- `transform` defines a SQL-level expression to transform the column value, e.g. hashing.

