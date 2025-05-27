---
layout: docu
title: ducklake_partition_info
---

| Column name      | Column type |             |
| ---------------- | ----------- | ----------- |
| `partition_id`   | `BIGINT`    |             |
| `table_id`       | `BIGINT`    |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |

- `partition_id` is a numeric identifier for a partition.
- `table_id` refers to a `table_id` from the `ducklake_table` table. 
- `begin_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The partition is valid *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the `ducklake_snapshot` table. The partition is valid *until* this snapshot id. If `end_snapshot` is `NULL`, the partition is currently valid.
