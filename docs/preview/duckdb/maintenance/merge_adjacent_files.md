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

Compacting data files can be a very memory intensive operation. You may consider performing this operation in batches by specifying the `max_compacted_files` parameter.

```sql
CALL ducklake_merge_adjacent_files('my_ducklake', 't', schema => 'some_schema', max_compacted_files => 1000);
```

> Calling this function does not immediately delete the old files.
> See the [cleanup old files]({% link docs/preview/duckdb/maintenance/cleanup_of_files.md %}) section on how to trigger a cleanup of these files.
