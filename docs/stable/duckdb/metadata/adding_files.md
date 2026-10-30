---
layout: docu
title: Adding Files
---

The `ducklake_add_data_files` function can be used to register existing data files as new files in DuckLake.
The files are not copied over – DuckLake is merely made aware of their existence, allowing them to be queried through DuckLake.
Adding files in this manner supports regular transactional semantics.
`ducklake_add_data_files` is not supported for [encrypted DuckLake catalogs]({% link docs/stable/duckdb/advanced_features/encryption.md %}).

> The ownership of the Parquet file is transferred to DuckLake. As such, compaction operations (such as those triggered through `ducklake_merge_adjacent_files` or `ducklake_expire_snapshots` followed by `ducklake_cleanup_old_files`) can cause the files to be deleted by DuckLake.

## Usage

### Examples

Add the file `people.parquet` to the `people` table in `my_ducklake`:

```sql
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet');
```

Target a specific schema rather than the default:

```sql
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet', schema => 'some_schema');
```

The `schema` argument also accepts nested paths such as `'some_schema.child'`.

Add the file. Any columns that are present in the table but not in the file will have their initial default values used when reading:

```sql
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet', allow_missing => true);
```

Add the file. If the file has extra columns not in the table they will be ignored (they will not be queryable through DuckLake):

```sql
CALL ducklake_add_data_files('my_ducklake', 'people', 'people.parquet', ignore_extra_columns => true);
```

When a file is referenced by equivalent paths in the same call, it is registered only once.

### Missing Columns

When adding files to a table, all columns that are present in the table must be present in the Parquet file or supplied by Hive partition directories, otherwise an error is thrown.
The `allow_missing` option can be used to add the file anyway – in which case any missing columns will be substituted with the `initial_default` value of the column.

`NOT NULL` constraints are enforced for imported files.

### Extra Columns

When adding files to a table, if there are any columns present that are not present in the table, an error is thrown by default.
The `ignore_extra_columns` option can be used to add the file anyway – any extra columns will be ignored and unreachable.

Parquet field IDs that do not refer to live fields in the table are rejected even with `ignore_extra_columns => true`.

### Hive-Partitioned Files

For tables partitioned on multiple keys, Hive values are recorded against the matching partition keys, regardless of directory order.
Transformed values such as `year`, `epoch_month`, and `bucket` are stored as partition values, not as source column statistics.
When key names collide, use DuckLake's disambiguated directory names: `PARTITIONED BY (year, year(dt))` uses `year` and `year_dt`.

## Type Mapping

In general, types of columns in the source Parquet file must match the type as defined in the table, otherwise an error is thrown. Types in the Parquet file can be narrower than the type defined in the table. Below is a supported mapping type:

| Table type      | Supported Parquet types                         |
| --------------- | ----------------------------------------------- |
| `bool`          | `bool`                                          |
| `int8`          | `int8`                                          |
| `int16`         | `int[8/16]`, `uint8`                            |
| `int32`         | `int[8/16/32]`, `uint[8/16]`                    |
| `int64`         | `int[8/16/32/64]`, `uint[8/16/32]`              |
| `uint8`         | `uint8`                                         |
| `uint16`        | `uint[8/16]`                                    |
| `uint32`        | `uint[8/16/32]`                                 |
| `uint64`        | `uint[8/16/32/64]`                              |
| `float`         | `float/float16`                                 |
| `double`        | `float/double/float16`                          |
| `decimal(P, S)` | `decimal(P',S')`, where `P' <= P `and `S' <= S` |
| `blob`          | `blob`                                          |
| `varchar`       | `varchar`                                       |
| `json`          | `json`                                          |
| `date`          | `date`                                          |
| `time`          | `time`                                          |
| `time_ns`       | `time_ns`                                       |
| `timetz`        | `timetz`                                        |
| `timestamp`     | `timestamp`, `timestamp_ns`                     |
| `timestamp_ns`  | `timestamp`, `timestamp_ns`                     |
| `timestamptz`   | `timestamptz`, `timestamptz_ns`                  |
| `timestamptz_ns` | `timestamptz_ns`                               |
| `null`          | `null`                                          |
| `variant`       | `variant`                                       |
| `geometry`      | `geometry`                                      |

Parquet `FLOAT16` columns are read as `FLOAT`.
`TIMETZ` values are normalized to UTC when read from Parquet.
Legacy repeated fields can be imported into `LIST` columns.

`VARIANT` imports require a native Parquet `VARIANT` annotation and are supported only for top-level columns.
Native Parquet `GEOMETRY` is accepted even when geospatial statistics are absent.
GeoParquet v1 geometry stored as `BLOB` and Parquet `GEOGRAPHY` are not supported.

DuckDB writes native Parquet `GEOMETRY` columns when `COPY` uses `GEOPARQUET_VERSION 'V2'`, `'BOTH'`, or `'NONE'`.
The default `COPY` output is GeoParquet v1, which `ducklake_add_data_files` rejects.
