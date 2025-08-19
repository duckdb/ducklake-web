---
layout: docu
title: List Files
---

The `ducklake_list_files` function can be used to list the data files and corresponding delete files that belong to a given table, optionally for a given snapshot.

### Usage

```sql
-- list all files
FROM ducklake_list_files('catalog', 'table_name');
-- get list of files at a specific snapshot_version
FROM ducklake_list_files('catalog', 'table_name', snapshot_version => 2);
-- get list of files at a specific point in time
FROM ducklake_list_files('catalog', 'table_name', snapshot_time => '2025-06-16 15:24:30');
-- get list of files of a table in a specific schema
FROM ducklake_list_files('catalog', 'table_name', schema => 'main');
```

|    Parameter     |                   Description                    | Default |
|------------------|--------------------------------------------------|---------|
| catalog          | Name of attached DuckLake catalog                |         |
| table_name       | Name of table to fetch files from                |         |
| schema           | Schema for the table                             | main    |
| snapshot_version | If provided, fetch files for a given snapshot id |         |
| snapshot_time    | If provided, fetch files for a given timestamp   |         |

### Result

The function returns the following result set.

|        column_name         | column_type |
|----------------------------|-------------|
| data_file                  | VARCHAR     |
| data_file_size_bytes       | UBIGINT     |
| data_file_footer_size      | UBIGINT     |
| data_file_encryption_key   | BLOB        |
| delete_file                | VARCHAR     |
| delete_file_size_bytes     | UBIGINT     |
| delete_file_footer_size    | UBIGINT     |
| delete_file_encryption_key | BLOB        |


* If the file has delete files, the corresponding delete file is returned, otherwise these fields are `NULL`.
* If the database is encrypted, the encryption key must be used to read the file.
* The `footer_size` refers to the Parquet footer size - this is optionally provided.
