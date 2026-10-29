---
layout: docu
title: Rewrite Heavily Deleted Files
---

DuckLake uses a merge-on-read strategy when data is deleted from a table. In short, this means that DuckLake uses a delete file which contains a pointer to the deleted records on the original file. This makes deletes very efficient. However, for heavily deleted tables, reading performance will be hindered by this approach. To solve this problem, DuckLake exposes a function called `ducklake_rewrite_data_files` that rewrites files that contain an amount of deletes bigger than a given threshold to a new file that contains non-deleted records. These files can then be further compacted with a [`ducklake_merge_adjacent_files`]({% link docs/1.0/duckdb/maintenance/merge_adjacent_files.md %}) operation. The default value for the delete threshold is 0.95.

## Usage

Apply to all tables in a catalog:

```sql
CALL ducklake_rewrite_data_files('my_ducklake');
```

Apply only to a specific table:

```sql
CALL ducklake_rewrite_data_files('my_ducklake', 't');
```

Provide a specific value for the delete threshold:

```sql
CALL ducklake_rewrite_data_files('my_ducklake', 't', delete_threshold => 0.5);
```

Set a specific threshold for the whole catalog:

```sql
CALL my_ducklake.set_option('rewrite_delete_threshold', 0.5);
```

Set a specific threshold for a schema:

```sql
CALL my_ducklake.set_option('rewrite_delete_threshold', 0.5, schema => 'my_schema');
```

Set a specific threshold for a table:

```sql
CALL my_ducklake.set_option('rewrite_delete_threshold', 0.5, table_name => 'my_table');
```

Disable compaction for a specific table:

```sql
CALL my_ducklake.set_option('auto_compact', false, table_name => 'my_table');
```

If a table has `auto_compact` set to `false`, `ducklake_rewrite_data_files` will skip it, including when the table is named explicitly in the call. The same applies when rewriting via `CHECKPOINT`, since `CHECKPOINT` calls `ducklake_rewrite_data_files` internally.

## Return Values

`ducklake_rewrite_data_files` returns one row per output file created, with the following columns:

| Column            | Type      | Description                                              |
| ----------------- | --------- | -------------------------------------------------------- |
| `schema_name`     | `VARCHAR` | Name of the schema containing the table                  |
| `table_name`      | `VARCHAR` | Name of the table                                        |
| `files_processed` | `BIGINT`  | Number of input files rewritten into this output file    |
| `files_created`   | `BIGINT`  | Always `1` — each row represents one output file created |

Because each row corresponds to one output file, `files_created` is always `1`. To see the total number of output files produced per table, use a `GROUP BY`:

```sql
SELECT schema_name, table_name, sum(files_created) AS total_output_files
FROM ducklake_rewrite_data_files('my_ducklake')
GROUP BY schema_name, table_name;
```
