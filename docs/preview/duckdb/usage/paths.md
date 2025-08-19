---
layout: docu
title: Paths
---

DuckLake manages files stored in a separate storage location.
The paths to the files are stored in the catalog server.
Paths can be either absolute or relative to their parent path.
Whether or not a path is relative is stored in the `path_is_relative` column, alongside the `path`. 
By default, all paths written by DuckLake are relative paths.

|  Path Type  |               Path Location               | Parent Path |
|-------------|-------------------------------------------|-------------|
| File Path   | ducklake_data_file / ducklake_delete_file | Table Path  |
| Table Path  | ducklake_table                            | Schema Path |
| Schema Path | ducklake_schema                           | Data Path   |
| Data Path   | ducklake_metadata                         |             |

### Default Path Structure

The root `data_path` is specified through the [`data_path` parameter](connecting) when creating a new DuckLake.
When loading an existing Ducklake, the `data_path` is loaded from the `ducklake_metadata` if not provided.

**Schemas.** When creating a schema, a schema path is set. By default, this path is the name of the schema for alphanumeric names (`{schema_name}/`) - or `{schema_uuid}/` otherwise. 
This path is set as relative to the root `data_path`.

**Tables.** When creating a table, a table path is set. By default, this path is the name of the schema for alphanumeric names (`{table_name}/`) - or `{table_uuid}/` otherwise. 
This path is set as relative to the path of the parent schema.

**Files.** When writing a new data or delete file to the table, a new file path is generated.
For unpartitioned tables, this path is `ducklake-{uuid}.parquet` - relative to the table path. 

**Partitioned Files.** When writing data to a partitioned table, the files are by default written to directories in the [hive partitioning style](https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html#hive-partitioning).
Writing data in this manner is not required as the partition values are tracked in the catalog server itself.
For encrypted tables, the partitioned paths are omitted, and the files are all writte

This results in the following path structure:

```
main
├── unpartitioned_table
│   └── ducklake-{uuid}.parquet
└── partitioned_table
	└── year=2025
	    └── ducklake-{uuid}.parquet
```
