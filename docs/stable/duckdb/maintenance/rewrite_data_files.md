---
layout: docu
title: Rewrite Heavily Deleted Files
---

DuckLake uses a merge-on-read strategy when data is deleted from a table. In short, this means that DuckLake uses a delete file or inlined deletion metadata which contains a pointer to the deleted records on the original file. This makes deletes very efficient. However, for heavily deleted tables, reading performance will be hindered by this approach. To solve this problem, DuckLake exposes a function called `ducklake_rewrite_data_files` that rewrites files that contain an amount of deletes at least equal to a given threshold to new files that contain non-deleted records. These files can then be further compacted with a [`ducklake_merge_adjacent_files`]({% link docs/stable/duckdb/maintenance/merge_adjacent_files.md %}) operation. The default value for the delete threshold is 0.95.

Delete files can contain positional deletes or Puffin deletion vectors.
Inlined deletions count toward the threshold without needing to be flushed first.

## Usage

Apply to all tables in a catalog:

```sql
CALL ducklake_rewrite_data_files('my_ducklake');
```

Apply only to a specific table:

```sql
CALL ducklake_rewrite_data_files('my_ducklake', 't');
```

Apply to a table in a specific schema:

```sql
CALL ducklake_rewrite_data_files('my_ducklake', 't', schema => 'some_schema');
```

The `schema` argument requires a table name.
It also accepts nested paths such as `'some_schema.child'`.

Provide a specific value for the delete threshold:

```sql
CALL ducklake_rewrite_data_files('my_ducklake', 't', delete_threshold => 0.5);
```

Limit the number of rewrite operations per table:

```sql
CALL ducklake_rewrite_data_files('my_ducklake', max_compacted_files => 10);
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
The `auto_compact` option does not schedule automatic rewrites.

Rewrites combine eligible files toward `target_file_size` and can split large files into multiple output files.
The `ducklake_target_file_size` setting overrides the persistent target.
The current [sort order]({% link docs/stable/duckdb/advanced_features/sorted_tables.md %}) is preserved when it can be evaluated against the input schema.

## Return Values

`ducklake_rewrite_data_files` returns one row per rewrite operation, with the following columns:

| Column            | Type      | Description                                              |
| ----------------- | --------- | -------------------------------------------------------- |
| `schema_name`     | `VARCHAR` | Name of the schema containing the table                  |
| `table_name`      | `VARCHAR` | Name of the table                                        |
| `files_processed` | `BIGINT`  | Number of input files rewritten by this operation        |
| `files_created`   | `BIGINT`  | Number of output files created by this operation         |

The `files_created` value can exceed `1`, or be `0` if no rows remain. To see the total number of output files produced per table, use a `GROUP BY`:

```sql
SELECT schema_name, table_name, sum(files_created) AS total_output_files
FROM ducklake_rewrite_data_files('my_ducklake')
GROUP BY schema_name, table_name;
```
