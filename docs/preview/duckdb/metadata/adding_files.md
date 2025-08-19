---
layout: docu
title: Adding Files
---

The `ducklake_add_data_files` function can be used to register existing data files as new files in DuckLake.
The files are not copied over - DuckLake is merely made aware of their existence, allowing them to be queried through DuckLake.
Adding files in this manner supports regular transactional semantics.
 
> Note that ownership of the Parquet file is transferred to DuckLake. As such, compaction operations (such as those triggered through `merge_adjacent_files` or `expire_snapshots` followed by `cleanup_old_files`) can cause the files to be deleted by DuckLake.


### Usage

```sql
-- add the file "people.parquet" to the "people" table in "my_ducklake"
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet');
-- add the file - any columns that are present in the table but not in the file will have their default values used when reading
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet', allow_missing => true);
-- add the file - if the file has extra columns in the table they will be ignored (they will not be queryable through DuckLake)
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet', ignore_extra_columns => true);
```

#### Missing Columns

When adding files to a table, all columns that are present in the table must be present in the Parquet file, otherwise an error is thrown.
The `allow_missing` option can be used to add the file anyway - in which case any missing columns will be substituted with the `initial_default` value of the column.

#### Extra Columns

When adding files to a table, if there are any columns present that are not present in the table, an error is thrown by default.
The `ignore_extra_columns` option can be used to add the file anyway - any extra columns will be ignored and unreachable.

### Type Mapping

In general, types of columns in the source Parquet file must match the type as defined in the table, otherwise an error is thrown. Types in the Parquet file can be narrower than the type defined in the table. Below is a supported mapping type:

|  Table Type   | Supported Parquet Types                     |
|---------------|---------------------------------------------|
| bool          | `bool`                                      |
| int8          | `int8`                                      |
| int16         | `int[8/16], uint8`                          |
| int32         | `int[8/16/32], uint[8/16]`                  |
| int64         | `int[8/16/32/64], uint[8/16/32]`            |
| uint8         | `uint8`                                     |
| uint16        | `uint[8/16]`                                |
| uint32        | `uint[8/16/32]`                             |
| uint64        | `uint[8/16/32/64]`                          |
| float         | `float`                                     |
| double        | `float/double`                              |
| decimal(P, S) | `decimal(P',S'), where P' <= P and S' <= S` |
| blob          | `blob`                                      |
| varchar       | `varchar`                                   |
| date          | `date`                                      |
| time          | `time`                                      |
| timestamp     | `timestamp, timestamp_ns`                   |
| timestamp_ns  | `timestamp, timestamp_ns`                   |
| timestamptz   | `timestamptz`                               |
