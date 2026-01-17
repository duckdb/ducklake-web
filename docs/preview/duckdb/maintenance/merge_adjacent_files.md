---
layout: docu
title: Merge Adjacent Files
---

Unless [data inlining is used]({% link docs/preview/duckdb/advanced_features/data_inlining.md %}), each insert to DuckLake writes data to a new Parquet file.
If small insertions are performed, the Parquet files that are written are small. These only hold a few rows.
For performance reasons, it is generally recommended that Parquet files are at least a few megabytes each.

DuckLake supports merging of files **without needing to expire snapshots**.
This is supported due to the _lightweight snapshots_ that can refer to a part of a Parquet file.
Effectively, we can merge multiple Parquet files into a single Parquet file that holds data inserted by multiple snapshots.
The data file is then setup so that the snapshots refer to only part of that Parquet file.

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

## Advanced Options

The `merge_adjacent_files` function supports optional parameters to filter which files are considered for compaction and control memory usage. This enables advanced compaction strategies and more granular control over the compaction process.

- **`max_compacted_files`**: Limits the maximum number of files to compact in a single operation. Compacting data files can be a very memory intensive operation, so you may consider performing this operation in batches by specifying this parameter.
- **`min_file_size`**: Files smaller than this size (in bytes) are excluded from compaction. If not specified, all files are considered regardless of minimum size.
- **`max_file_size`**: Files at or larger than this size (in bytes) are excluded from compaction. If not specified, it defaults to `target_file_size`. Must be greater than 0.

Example with compacted files limit:

```sql
CALL ducklake_merge_adjacent_files('my_ducklake', max_compacted_files => 100);
```

Example with size filtering:

```sql
-- Only merge files between 10KB and 100KB
CALL ducklake_merge_adjacent_files('my_ducklake', min_file_size => 10240, max_file_size => 102400);
```

### Example: Tiered Compaction Strategy for Streaming Workloads

File size filtering enables tiered compaction strategies, which are particularly useful for realtime/streamed ingestion patterns. A tiered approach merges files in stages:

- **Tier 0 → Tier 1**: Done often, merge small files (< 1MB) into ~5MB files
- **Tier 1 → Tier 2**: Done occasionally, merge medium files (1MB-10MB) into ~32MB files
- **Tier 2 → Tier 3**: Done rarely, merge large files (10MB-64MB) into ~128MB files

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

> Calling this function does not immediately delete the old files.
> See the [cleanup old files]({% link docs/preview/duckdb/maintenance/cleanup_of_files.md %}) section on how to trigger a cleanup of these files.
