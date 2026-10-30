---
layout: docu
title: Data Types
---

DuckLake specifies multiple different data types for field values, and also supports nested types.
The types of columns are defined in the `column_type` field of the `ducklake_column` table.

## Primitive Types

| Type             | Description                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `boolean`        | True or false                                                                                |
| `null`           | A value that can only be `NULL`                                                              |
| `int8`           | 8-bit signed integer                                                                         |
| `int16`          | 16-bit signed integer                                                                        |
| `int32`          | 32-bit signed integer                                                                        |
| `int64`          | 64-bit signed integer                                                                        |
| `uint8`          | 8-bit unsigned integer                                                                       |
| `uint16`         | 16-bit unsigned integer                                                                      |
| `uint32`         | 32-bit unsigned integer                                                                      |
| `uint64`         | 64-bit unsigned integer                                                                      |
| `int128`         | 128-bit signed integer                                                                       |
| `uint128`        | 128-bit unsigned integer                                                                     |
| `float32`        | 32-bit [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) floating-point value               |
| `float64`        | 64-bit [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) floating-point value               |
| `decimal(P, S)`  | Fixed-point decimal with precision `P` and scale `S`                                         |
| `time`           | Time of day, microsecond precision                                                           |
| `time_ns`        | Time of day, nanosecond precision                                                            |
| `timetz`         | Time of day, microsecond precision, with time zone                                           |
| `date`           | Calendar date                                                                                |
| `timestamp`      | Timestamp, microsecond precision                                                             |
| `timestamptz`    | Timestamp, microsecond precision, with time zone                                             |
| `timestamptz_ns` | Timestamp, nanosecond precision, with time zone                                              |
| `timestamp_s`    | Timestamp, second precision                                                                  |
| `timestamp_ms`   | Timestamp, millisecond precision                                                             |
| `timestamp_ns`   | Timestamp, nanosecond precision                                                              |
| `interval`       | Time interval in three different granularities: months, days, and microseconds               |
| `varchar`        | Text                                                                                         |
| `blob`           | Binary data                                                                                  |
| `json`           | JSON                                                                                         |
| `uuid`           | [Universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier) |

The `null` type requires DuckLake format version 1.1 and is spelled `"NULL"` in DuckDB SQL.
It can also occur inside a list, struct, or map.

## Nested Types

DuckLake supports nested types and primitive types. Nested types are defined recursively using the `parent_column` field in the [`ducklake_column`]({% link docs/stable/specification/tables/ducklake_column.md %}) table. For example, a column of type `INT[]` is stored as two rows: a parent column of type `list`, and a child column of type `int32` whose `parent_column` points to the parent.

The following nested types are supported:

| Type     | Description                                   |
| -------- | --------------------------------------------- |
| `list`   | Collection of values with a single child type |
| `struct` | A tuple of typed values                       |
| `map`    | A collection of key-value pairs               |

## Semi-Structured Types

| Type      | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| `variant` | A dynamically typed value that can hold primitive or nested types, stored in a binary encoding. |

The `variant` type is similar to JSON but is more strongly typed internally, supports a wider range of types (e.g., `date`, `timestamp`, `decimal`), and is stored in a binary-encoded format rather than as a string. Variants are stored in Parquet files according to the [Parquet variant encoding specification](https://github.com/apache/parquet-format/blob/master/VariantEncoding.md).

Variants can be **shredded** into their constituent primitive types when all rows share a consistent schema for a given sub-field. Shredded fields are stored and queried with the same efficiency as native primitive columns. Per-file statistics for fully shredded sub-fields are recorded in the [`ducklake_file_variant_stats`]({% link docs/stable/specification/tables/ducklake_file_variant_stats.md %}) table.

> The `variant` type is natively supported in DuckDB. For catalog databases that do not have a native variant type (e.g., PostgreSQL, SQLite), variants are encoded as blobs for data inlining.
> Inlining variants in these catalogs requires DuckLake format version 1.1.

## Geometry Types

DuckLake supports geometry types using the `geometry` type of the Parquet format. The `geometry` type can store different types of spatial representations called geometry primitives, of which DuckLake supports the following:

| Geometry primitive   | Description                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `point`              | A single location in coordinate space.                                                          |
| `linestring`         | A sequence of points connected by straight line segments.                                       |
| `polygon`            | A planar surface defined by one exterior boundary and zero or more interior boundaries (holes). |
| `multipoint`         | A collection of `point` geometries.                                                             |
| `multilinestring`    | A collection of `linestring` geometries.                                                        |
| `multipolygon`       | A collection of `polygon` geometries.                                                           |
| `linestring_z`       | A `linestring` geometry with an additional Z (elevation) coordinate for each point.             |
| `geometrycollection` | A heterogeneous collection of geometry primitives (e.g., points, lines, polygons, etc.).        |

## Type Encoding for Statistics

Statistics values are string-encoded, as they must be stored as `VARCHAR`, since that allows storing types that are not native to the catalog database system (e.g., PostgreSQL does not support `VARIANT` natively). Statistics are stored in both `ducklake_file_column_stats` and `ducklake_table_column_stats`.
Most types follow a straightforward encoding, however some do not. The following table describes the encoding of each type:

| Type             | Description                                                                                                                                                                              | Example                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `boolean`        | `0` or `1` for Parquet writer statistics (`false` or `true` can occur in table statistics from inlined data)                                                                             | `1`                                       |
| `int8`           | Integer string                                                                                                                                                                           | `42`                                      |
| `int16`          | Integer string                                                                                                                                                                           | `1000`                                    |
| `int32`          | Integer string                                                                                                                                                                           | `100000`                                  |
| `int64`          | Integer string                                                                                                                                                                           | `100000000`                               |
| `uint8`          | Integer string                                                                                                                                                                           | `255`                                     |
| `uint16`         | Integer string                                                                                                                                                                           | `65535`                                   |
| `uint32`         | Integer string                                                                                                                                                                           | `4294967295`                              |
| `uint64`         | Integer string                                                                                                                                                                           | `18446744073709551615`                    |
| `int128`         | Integer string when bounds are available from inlined data                                                                                                                               | `170141183460469231731687303715884105727` |
| `uint128`        | Integer string when bounds are available from inlined data                                                                                                                               | `340282366920938463463374607431768211455` |
| `float32`        | Numeric string with special values: `inf`, `-inf`. `NaN` values are excluded from min/max, the `contains_nan` flag indicates their presence                                              | `3.14`                                    |
| `float64`        | Numeric string with special values: `inf`, `-inf`. `NaN` values are excluded from min/max, the `contains_nan` flag indicates their presence                                              | `3.14159265358979`                        |
| `decimal`        | Numeric string (independent of precision and scale)                                                                                                                                      | `12345.67`                                |
| `date`           | ISO 8601 date with special values: `infinity`, `-infinity`                                                                                                                               | `2024-01-15`                              |
| `time`           | ISO 8601 time with microseconds if non-zero                                                                                                                                              | `12:30:00.123456`                         |
| `time_ns`        | ISO 8601 time with nanoseconds if non-zero                                                                                                                                               | `12:30:00.123456789`                      |
| `timetz`         | ISO 8601 time with UTC offset. Parquet writer statistics are normalized to `+00`                                                                                                         | `10:30:00+00`                             |
| `timestamp`      | ISO 8601 timestamp with microseconds if non-zero, with special values: `infinity`, `-infinity`                                                                                           | `2024-01-15 12:30:00.123456`              |
| `timestamptz`    | ISO 8601 timestamp with UTC offset, with special values: `infinity`, `-infinity`                                                                                                         | `2024-01-15 12:30:00.123456+00`           |
| `timestamptz_ns` | ISO 8601 timestamp with nanoseconds if non-zero and UTC offset, with special values: `infinity`, `-infinity`                                                                             | `2024-01-15 12:30:00.123456789+00`        |
| `timestamp_s`    | ISO 8601 timestamp (second precision) with special values: `infinity`, `-infinity`                                                                                                       | `2024-01-15 12:30:00`                     |
| `timestamp_ms`   | ISO 8601 timestamp (millisecond precision) with special values: `infinity`, `-infinity`                                                                                                  | `2024-01-15 12:30:00.123`                 |
| `timestamp_ns`   | ISO 8601 timestamp (nanosecond precision) with special values: `infinity`, `-infinity`                                                                                                   | `2024-01-15 12:30:00.123456789`           |
| `varchar`        | As-is                                                                                                                                                                                    | `hello`                                   |
| `json`           | As-is                                                                                                                                                                                    | `{"key": "value"}`                        |
| `blob`           | Hex-encoded raw bytes for Parquet writer statistics. Table bounds from inlined data use DuckDB's escaped blob text representation, and a table statistics row can contain both encodings | `68656C6C6F20776F726C64`                  |
| `uuid`           | Standard UUID string                                                                                                                                                                     | `550e8400-e29b-41d4-a716-446655440000`    |

The following types do not currently have min/max statistics from the Parquet writer:

* `int128`
* `uint128`
* `interval`

Table statistics can still contain bounds from inlined values.
The `min_is_exact` and `max_is_exact` fields distinguish exact bounds from conservative bounds, such as truncated strings.

### Nested Types

Nested types (`list`, `struct`, `map`) do not have min/max statistics themselves, statistics are collected recursively for their child columns instead. For example:

Given the following table:

```sql
CREATE TABLE nested_types (
    col_list INT[],
    col_struct STRUCT(a INT, b VARCHAR),
    col_map MAP(VARCHAR, INT)
);
INSERT INTO nested_types VALUES
    ([1, 2, 3], {'a': 10, 'b': 'hello'}, MAP {'x': 1}),
    ([4, 5, 6], {'a': 20, 'b': 'world'}, MAP {'y': 2});
```

The parent columns (`col_list`, `col_struct`, `col_map`) have no min/max statistics. Instead, the child columns store:

| Child column | Type      | Min     | Max     |
| ------------ | --------- | ------- | ------- |
| `element`    | `int32`   | `1`     | `6`     |
| `a`          | `int32`   | `10`    | `20`    |
| `b`          | `varchar` | `hello` | `world` |
| `key`        | `varchar` | `x`     | `y`     |
| `value`      | `int32`   | `1`     | `2`     |

### Extra Statistics

For Parquet files, the `geometry` and `variant` types do not use string-encoded min/max values. Instead, their statistics are stored as JSON in the `extra_stats` column of the statistics tables.

#### Geometry

Geometry statistics contain a bounding box (`bbox`) and a list of geometry primitive types present in the column (`types`). For example:

```json
{
    "bbox": {
        "xmin": 0.000000,
        "xmax": 5.000000,
        "ymin": 0.000000,
        "ymax": 5.000000,
        "zmin": null,
        "zmax": null,
        "mmin": null,
        "mmax": null
    },
    "types": ["point"]
}
```

#### Variant

Variant statistics contain a JSON array with one entry per fully shredded sub-field. Each entry records the field path, its shredded type, and min/max statistics for that sub-field. If no sub-fields are fully shredded, `extra_stats` is `NULL`. An example of a Variant `extra_stats`:

```json
[
    {
        "field_name": "root",
        "shredded_type": "int32",
        "null_count": 0,
        "min": "42",
        "max": "99",
        "num_values": 3,
        "column_size_bytes": 37,
        "any_valid": true
    }
]
```

`num_values` includes null values, whereas `value_count` in `ducklake_file_variant_stats` excludes them.

## Type Encoding for Data Inlining

When storing columns for data inlining, a table is created in the catalog to store small inserts and updates in the database. Since DuckDB supports all DuckDB types, inlining types in a DuckDB catalog is straightforward. However, other catalogs might require encodings for non-native types.

For PostgreSQL and SQLite, `VARIANT` values are stored as the Parquet variant `metadata` bytes followed by the `value` bytes.
Within nested values, variant children are encoded as blobs before the nested value is stored as text.

### PostgreSQL Catalog

PostgreSQL does not natively support all DuckDB types. The following table describes how each DuckDB type is mapped to a PostgreSQL type for inlined data storage. Types not listed below (e.g., `BOOLEAN`, `SMALLINT`, `INTEGER`, `BIGINT`, `FLOAT`, `DOUBLE`, `DECIMAL`, `TIME`, `TIMETZ`, `INTERVAL`, `UUID`) are stored using their native PostgreSQL equivalents.

| DuckDB&nbsp;type | PostgreSQL&nbsp;type | Encoding                                                                                                                  | Example                                                                                                 |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `TINYINT`        | `SMALLINT`           | Direct cast                                                                                                               | `42` -> `42`                                                                                            |
| `UTINYINT`       | `INTEGER`            | Direct cast                                                                                                               | `200` -> `200`                                                                                          |
| `USMALLINT`      | `INTEGER`            | Direct cast                                                                                                               | `50000` -> `50000`                                                                                      |
| `UINTEGER`       | `BIGINT`             | Direct cast                                                                                                               | `3000000000` -> `3000000000`                                                                            |
| `UBIGINT`        | `VARCHAR`            | Stored as text                                                                                                            | `18446744073709551615` -> `'18446744073709551615'`                                                      |
| `HUGEINT`        | `VARCHAR`            | Stored as text                                                                                                            | `-170141183460469231731687303715884105728` -> `'-170141183460469231731687303715884105728'`              |
| `UHUGEINT`       | `VARCHAR`            | Stored as text                                                                                                            | `340282366920938463463374607431768211455` -> `'340282366920938463463374607431768211455'`                |
| `VARCHAR`        | `BYTEA`              | Text reinterpreted as bytes. PostgreSQL cannot store null bytes in `VARCHAR`/`TEXT`                                       | `'hello world'` -> `\x68656c6c6f20776f726c64`                                                           |
| `BLOB`           | `BYTEA`              | Binary data stored directly as `BYTEA`                                                                                    | `'\x00\xFF'::BLOB` -> `\x00ff`                                                                          |
| `JSON`           | `BYTEA`              | Text reinterpreted as bytes. DuckDB's `JSON` type is internally `VARCHAR`, so it follows the same as `VARCHAR` to `BYTEA` | `'{"key": "value"}'` -> `\x7b226b6579223a202276616c7565227d`                                            |
| `DATE`           | `VARCHAR`            | Stored as text                                                                                                            | `2024-01-15` -> `'2024-01-15'`                                                                          |
| `TIMESTAMP`      | `VARCHAR`            | Stored as text                                                                                                            | `2024-01-15 12:30:00.123456` -> `'2024-01-15 12:30:00.123456'`                                          |
| `TIMESTAMPTZ`    | `VARCHAR`            | Stored as text                                                                                                            | `2024-01-15 12:30:00.123456+00` -> `'2024-01-15 12:30:00.123456+00'`                                    |
| `TIMESTAMP_S`    | `VARCHAR`            | Stored as text                                                                                                            | `2024-01-15 12:30:00` -> `'2024-01-15 12:30:00'`                                                        |
| `TIMESTAMP_MS`   | `VARCHAR`            | Stored as text                                                                                                            | `2024-01-15 12:30:00.123` -> `'2024-01-15 12:30:00.123'`                                                |
| `TIMESTAMP_NS`   | `VARCHAR`            | Stored as text                                                                                                            | `2024-01-15 12:30:00.123456789` -> `'2024-01-15 12:30:00.123456789'`                                    |
| `TIME_NS`        | `VARCHAR`            | Stored as text to preserve nanosecond precision                                                                           | `12:30:00.123456789` -> `'12:30:00.123456789'`                                                          |
| `TIMESTAMPTZ_NS` | `VARCHAR`            | Stored as text in the session time zone, preserving nanosecond precision and the UTC offset                               | `2024-01-15 12:30:00.123456789+00` -> `'2024-01-15 12:30:00.123456789+00'` with `TimeZone` set to `UTC` |
| `"NULL"`         | `INTEGER`            | Always SQL `NULL`                                                                                                         | `NULL`                                                                                                  |
| `VARIANT`        | `BYTEA`              | Parquet variant metadata bytes followed by value bytes                                                                    |                                                                                                         |
| Nested types     | `VARCHAR`            | Stored as text, with nested variants encoded as blobs                                                                     | `[1, 2, 3]` -> `'[1, 2, 3]'`                                                                            |

### SQLite Catalog

SQLite has a flexible type system with only five storage classes: `INTEGER`, `REAL`, `TEXT`, `BLOB`, and `NULL`. DuckDB's SQLite scanner maps all integer types to `BIGINT` (i.e., SQLite's `INTEGER` type) and most other types to `VARCHAR` (SQLite's `TEXT` type). `BLOB` and `VARIANT` are stored as `BLOB`. The following table describes the non-trivial type mappings:

| DuckDB&nbsp;type                              | SQLite&nbsp;type | Encoding                                               | Example                                                                                    |
| --------------------------------------------- | ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `BOOLEAN`                                     | `BIGINT`         | Stored as integer (`0`/`1`)                            | `true` -> `1`                                                                              |
| `TINYINT`, `SMALLINT`, `INTEGER`, `BIGINT`    | `BIGINT`         | All integer types use SQLite's `INTEGER` affinity      | `42` -> `42`                                                                               |
| `UTINYINT`, `USMALLINT`, `UINTEGER`           | `BIGINT`         | Unsigned integers fit within `BIGINT` range            | `200` -> `200`                                                                             |
| `UBIGINT`                                     | `VARCHAR`        | Stored as text                                         | `18446744073709551615` -> `'18446744073709551615'`                                         |
| `HUGEINT`                                     | `VARCHAR`        | Stored as text                                         | `-170141183460469231731687303715884105728` -> `'-170141183460469231731687303715884105728'` |
| `UHUGEINT`                                    | `VARCHAR`        | Stored as text                                         | `340282366920938463463374607431768211455` -> `'340282366920938463463374607431768211455'`   |
| `FLOAT`                                       | `VARCHAR`        | Stored as text                                         | `3.14` -> `'3.14'`                                                                         |
| `DOUBLE`                                      | `VARCHAR`        | Stored as text                                         | `3.14159265358979` -> `'3.14159265358979'`                                                 |
| `DECIMAL`                                     | `VARCHAR`        | Stored as text                                         | `12345.67` -> `'12345.67'`                                                                 |
| `UUID`                                        | `VARCHAR`        | Stored as text                                         | `550e8400-...` -> `'550e8400-...'`                                                         |
| `VARIANT`                                     | `BLOB`           | Parquet variant metadata bytes followed by value bytes |                                                                                            |
| `"NULL"`                                      | `BIGINT`         | Always SQL `NULL`                                      | `NULL`                                                                                     |
| `DATE`, `TIME`, `TIMETZ`                      | `VARCHAR`        | Stored as text                                         | `2024-01-15` -> `'2024-01-15'`                                                             |
| `TIMESTAMP`, `TIMESTAMPTZ`                    | `VARCHAR`        | Stored as text                                         | `2024-01-15 12:30:00.123456` -> `'2024-01-15 12:30:00.123456'`                             |
| `TIMESTAMP_S`, `TIMESTAMP_MS`, `TIMESTAMP_NS` | `VARCHAR`        | Stored as text                                         | `2024-01-15 12:30:00.123` -> `'2024-01-15 12:30:00.123'`                                   |
| `TIME_NS`, `TIMESTAMPTZ_NS`                   | `VARCHAR`        | Stored as text, preserving nanosecond precision        |                                                                                            |
| `INTERVAL`                                    | `VARCHAR`        | Stored as text                                         | `1 year 2 months 3 days` -> `'1 year 2 months 3 days'`                                     |
| Nested types                                  | `VARCHAR`        | Stored as text, with nested variants encoded as blobs  | `[1, 2, 3]` -> `'[1, 2, 3]'`                                                               |
