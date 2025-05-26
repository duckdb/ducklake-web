---
layout: docu
title: Functions
---

The DuckDB DuckLake extension registers 8 table functions.
To invoke these functions use the `CALL` statement or place them in a `FROM` clause.

## Metadata Functions

### `ducklake_snapshots`

Returns the snapshots stored in the DuckLake catalog `catalog`.

| Parameter name | Parameter type | Named parameter | Description |
| -------------- | -------------- | --------------- | ----------- |
| `catalog`      | `VARCHAR`      | no              |             |

The information is encoded into a table with the following schema:

| Column name      | Column type                |
| ---------------- | -------------------------- |
| `snapshot_id`    | `BIGINT`                   |
| `snapshot_time`  | `TIMESTAMP WITH TIME ZONE` |
| `schema_version` | `BIGINT`                   |
| `changes`        | `MAP(VARCHAR, VARCHAR[])`  |

### `ducklake_table_info`

The `ducklake_table_info` function returns information on the tables stored in the DuckLake catalog `catalog`.

| Parameter name | Parameter type | Named parameter | Description |
| -------------- | -------------- | --------------- | ----------- |
| `catalog`      | `VARCHAR`      | no              |             |

The information is encoded into a table with the following schema:

| Column name              | Column type |
| ------------------------ | ----------- |
| `table_name`             | `VARCHAR`   |
| `schema_id`              | `BIGINT`    |
| `table_id`               | `BIGINT`    |
| `table_uuid`             | `UUID`      |
| `file_count`             | `BIGINT`    |
| `file_size_bytes`        | `BIGINT`    |
| `delete_file_count`      | `BIGINT`    |
| `delete_file_size_bytes` | `BIGINT`    |

### `ducklake_table_insertions`

The `ducklake_table_insertions` function returns the rows inserted in a given table between snapshots of given versions or timestamps.
The function has two variants, depending on whether `start_snapshot` and `end_snapshot` have types `BIGINT` or `TIMESTAMP WITH TIME ZONE`.

| Parameter name   | Parameter type                        | Named parameter | Description |
| ---------------- | ------------------------------------- | --------------- | ----------- |
| `catalog`        | `VARCHAR`                             | no              |             |
| `schema_name`    | `VARCHAR`                             | no              |             |
| `table_name`     | `VARCHAR`                             | no              |             |
| `start_snapshot` | `BIGINT` / `TIMESTAMP WITH TIME ZONE` | no              |             |
| `end_snapshot`   | `BIGINT` / `TIMESTAMP WITH TIME ZONE` | no              |             |

The schema of the table returned by the function is equivalent to that of the table `table_name`.

### `ducklake_table_deletions`

The `ducklake_table_deletions` function returns the rows deleted from a given table between snapshots of given versions or timestamps.
The function has two variants, depending on whether `start_snapshot` and `end_snapshot` have types `BIGINT` or `TIMESTAMP WITH TIME ZONE`.

| Parameter name   | Parameter type                        | Named parameter | Description |
| ---------------- | ------------------------------------- | --------------- | ----------- |
| `catalog`        | `VARCHAR`                             | no              |             |
| `schema_name`    | `VARCHAR`                             | no              |             |
| `table_name`     | `VARCHAR`                             | no              |             |
| `start_snapshot` | `BIGINT` / `TIMESTAMP WITH TIME ZONE` | no              |             |
| `end_snapshot`   | `BIGINT` / `TIMESTAMP WITH TIME ZONE` | no              |             |

The schema of the table returned by the function is equivalent to that of the table `table_name`.

### `ducklake_table_changes`

The `ducklake_table_changes` function returns the rows changed in a given table between snapshots of given versions or timestamps.
The function has two variants, depending on whether `start_snapshot` and `end_snapshot` have types `BIGINT` or `TIMESTAMP WITH TIME ZONE`.

| Parameter name   | Parameter type                        | Named parameter | Description |
| ---------------- | ------------------------------------- | --------------- | ----------- |
| `catalog`        | `VARCHAR`                             | no              |             |
| `schema_name`    | `VARCHAR`                             | no              |             |
| `table_name`     | `VARCHAR`                             | no              |             |
| `start_snapshot` | `BIGINT` / `TIMESTAMP WITH TIME ZONE` | no              |             |
| `end_snapshot`   | `BIGINT` / `TIMESTAMP WITH TIME ZONE` | no              |             |

The schema of the table returned by the function contains the following three columns plus the schema of the table `table_name`.

| Column name   | Column type | Description                              |
| ------------- | ----------- | ---------------------------------------- |
| `snapshot_id` | `BIGINT`    |                                          |
| `rowid`       | `BIGINT`    |                                          |
| `change_type` | `VARCHAR`   | The type of change: `insert` or `delete` |

## Commands

### `ducklake_cleanup_old_files`

The `ducklake_cleanup_old_files` function cleans up old files in the DuckLake denoted by `catalog`.
Upon success, it returns a table with a single column (`Success`) and 0 rows.

| Parameter name | Parameter type             | Named parameter | Description |
| -------------- | -------------------------- | --------------- | ----------- |
| `catalog`      | `VARCHAR`                  | no              |             |
| `cleanup_all`  | `BOOLEAN`                  | yes             |             |
| `dry_run`      | `BOOLEAN`                  | yes             |             |
| `older_than`   | `TIMESTAMP WITH TIME ZONE` | yes             |             |


### `ducklake_expire_snapshots`

The `ducklake_expire_snapshots` function expires snapshots with the versions specified by the `versions` parameter or the ones older than the `older_than` parameter.
Upon success, it returns a table with a single column (`Success`) and 0 rows.

| Parameter name | Parameter type             | Named parameter | Description |
| -------------- | -------------------------- | --------------- | ----------- |
| `catalog`      | `VARCHAR`                  | no              |             |
| `versions`     | `UBIGINT[]`                | yes             |             |
| `older_than`   | `TIMESTAMP WITH TIME ZONE` | yes             |             |

### `ducklake_merge_adjacent_files`

The `ducklake_merge_adjacent_files` function merges adjacent files in the storage.
Upon success, it returns a table with a single column (`Success`) and 0 rows.

| Parameter name | Parameter type | Named parameter | Description |
| -------------- | -------------- | --------------- | ----------- |
| `catalog`      | `VARCHAR`      | no              |             |
