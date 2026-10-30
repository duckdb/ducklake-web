---
layout: docu
title: Merge Adjacent Files
---

Unless [data inlining is used]({% link docs/1.0/duckdb/advanced_features/data_inlining.md %}), each insert to DuckLake writes data to a new Parquet file.
If small insertions are performed, the Parquet files that are written are small. These only hold a few rows.
For performance reasons, it is generally recommended that Parquet files are at least a few megabytes each.

DuckLake supports merging of files **without needing to expire snapshots**.
Effectively, we can merge multiple Parquet files into a single Parquet file that holds data inserted by multiple snapshots.
The resulting file is a *partial data file*: per-row snapshot ownership is tracked via a `_ducklake_internal_snapshot_id` column embedded in the Parquet file, and the highest snapshot id present in the merged file is stored in the [`partial_max`]({% link docs/1.0/specification/tables/ducklake_data_file.md %}) column of `ducklake_data_file`.

This preserves all of the original behavior – including time travel and data change feeds – for these snapshots.
In effect, this manner of compaction is completely transparent from a user perspective.

This compaction technique can be triggered using the `merge_adjacent_files` function. For example:

```sql
CALL ducklake_merge_adjacent_files('my_ducklake');
```

Or if you want to target a specific table within a schema:

```sql
CALL ducklake_merge_adjacent_files('my_ducklake', 't', schema => 'some_schema');
```

## Controlling Which Tables Are Compacted

When `ducklake_merge_adjacent_files` is called without a table argument, it runs on all tables where the `auto_compact` option is `true` (the default). This lets you opt specific tables or schemas out of bulk compaction calls.

If a table has `auto_compact` set to `false`, `ducklake_merge_adjacent_files` will skip it, including when the table is named explicitly in the call. The same applies when merging via `CHECKPOINT`, since `CHECKPOINT` calls `ducklake_merge_adjacent_files` internally.

> **Note** `auto_compact` does not trigger compaction automatically after writes. Compaction always runs explicitly when you call a maintenance function.

Disable compaction for a specific table:

```sql
CALL my_ducklake.set_option('auto_compact', false, table_name => 'my_table');
```

Disable compaction for an entire schema, then re-enable it for one table within that schema:

```sql
CALL my_ducklake.set_option('auto_compact', false, schema => 'my_schema');
CALL my_ducklake.set_option('auto_compact', true, schema => 'my_schema', table_name => 'important_table');
```

With the above settings, calling `ducklake_merge_adjacent_files('my_ducklake')` will compact only `my_schema.important_table` and skip all other tables in `my_schema`. Tables in other schemas are unaffected and will still be compacted by default.

## Advanced Options

The `merge_adjacent_files` function supports optional parameters to filter which files are considered for compaction and control memory usage. This enables advanced compaction strategies and more granular control over the compaction process.

- **`max_compacted_files`:** Limits the maximum number of compaction operations produced in a single call, *per table*. Compacting data files can be a very memory intensive operation, so you may consider performing this operation in batches by specifying this parameter. Note that the number of actual compacted files is highly dependent on the `target_file_size` setting.
- **`min_file_size`:** Files smaller than this size (in bytes) are excluded from compaction. If not specified, all files are considered regardless of minimum size.
- **`max_file_size`:** Files at or larger than this size (in bytes) are excluded from compaction. If not specified, it defaults to `target_file_size`. Must be greater than 0.

Example with compacted files limit (applies per table when running across all tables):

```sql
CALL ducklake_merge_adjacent_files('my_ducklake', 'my_table', max_compacted_files => 10);
```

Example with size filtering:

```sql
-- Only merge files between 10KB and 100KB
CALL ducklake_merge_adjacent_files('my_ducklake', min_file_size => 10240, max_file_size => 102400);
```

### Example: Tiered Compaction Strategy for Streaming Workloads

File size filtering enables tiered compaction strategies, which are particularly useful for real-time/streamed ingestion patterns. A tiered approach merges files in stages:

- **Tier 0 → Tier 1:** Done often, merge small files (< 1MB) into ~5MB files
- **Tier 1 → Tier 2:** Done occasionally, merge medium files (1MB-10MB) into ~32MB files
- **Tier 2 → Tier 3:** Done rarely, merge large files (10MB-64MB) into ~128MB files

This compaction strategy provides more predictable I/O amplification and better incremental compaction for streaming workloads.

Example tiered compaction workflow:

```sql
-- Tier 0 → Tier 1: merge small files
CALL ducklake_set_option('my_ducklake', 'target_file_size', '5MB');
CALL ducklake_merge_adjacent_files('my_ducklake', max_file_size => 1048576);

-- Tier 1 → Tier 2: merge medium files
CALL ducklake_set_option('my_ducklake', 'target_file_size', '32MB');
CALL ducklake_merge_adjacent_files('my_ducklake', min_file_size => 1048576, max_file_size => 10485760);

-- Tier 2 → Tier 3: merge large files
CALL ducklake_set_option('my_ducklake', 'target_file_size', '128MB');
CALL ducklake_merge_adjacent_files('my_ducklake', min_file_size => 10485760, max_file_size => 67108864);
```

## Return Values

`ducklake_merge_adjacent_files` returns one row per output file created, with the following columns:

| Column            | Type      | Description                                              |
| ----------------- | --------- | -------------------------------------------------------- |
| `schema_name`     | `VARCHAR` | Name of the schema containing the table                  |
| `table_name`      | `VARCHAR` | Name of the table                                        |
| `files_processed` | `BIGINT`  | Number of input files merged into this output file       |
| `files_created`   | `BIGINT`  | Always `1` — each row represents one output file created |

Because each row corresponds to one output file, `files_created` is always `1`. To see the total number of output files produced per table, use a `GROUP BY`:

```sql
SELECT schema_name, table_name, sum(files_created) AS total_output_files
FROM ducklake_merge_adjacent_files('my_ducklake')
GROUP BY schema_name, table_name;
```

## Sorted Compaction

If a table has a [sort order defined]({% link docs/1.0/duckdb/advanced_features/sorted_tables.md %}), `ducklake_merge_adjacent_files` sorts the merged output by those keys before writing the resulting Parquet file. The sort order applied is the one currently active on the table at the time compaction runs — not the order that was active when the original files were written.

## Schema Evolution

`ducklake_merge_adjacent_files` only merges files that share the same schema version. Schema-altering DDL statements such as `ADD COLUMN`, `DROP COLUMN`, `RENAME COLUMN`, or `ALTER COLUMN` create a new schema version, so files written before and after the change end up in separate compaction groups and are never merged together. Cosmetic alterations such as `COMMENT ON` or changes to the sort key do not bump the schema version.

> Calling this function does not immediately delete the old files.
> See the [cleanup old files]({% link docs/1.0/duckdb/maintenance/cleanup_of_files.md %}) section on how to trigger a cleanup of these files.
