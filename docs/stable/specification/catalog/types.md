---
layout: docu
title: Types
---

## Data Types

DuckLake specifies multiple different data types for field values, and also supports nested types.
The types of columns are defined in the `column_type` field of the `ducklake_column` table.

### Primitive Types

| Type            | Description                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------- |
| `boolean`       | True or false                                                                                |
| `int8`          | 8-bit signed integer                                                                         |
| `int16`         | 16-bit signed integer                                                                        |
| `int32`         | 32-bit signed integer                                                                        |
| `int64`         | 64-bit signed integer                                                                        |
| `uint8`         | 8-bit unsigned integer                                                                       |
| `uint16`        | 16-bit unsigned integer                                                                      |
| `uint32`        | 32-bit unsigned integer                                                                      |
| `uint64`        | 64-bit unsigned integer                                                                      |
| `float32`       | 32-bit [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) floating-point value               |
| `float64`       | 64-bit [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) floating-point value               |
| `decimal(P, S)` | Fixed-point decimal with precision `P` and scale `S`                                         |
| `time`          | Time of day, microsecond precision                                                           |
| `timetz`        | Time of day, microsecond precision, with time zone                                           |
| `date`          | Calendar date                                                                                |
| `timestamp`     | Timestamp, microsecond precision                                                             |
| `timestamptz`   | Timestamp, microsecond precision, with time zone                                             |
| `timestamp_s`   | Timestamp, second precision                                                                  |
| `timestamp_ms`  | Timestamp, microsecond precision                                                             |
| `timestamp_ns`  | Timestamp, nanosecond precision                                                              |
| `interval`      | Time interval in three different granularities: months, days, and milliseconds               |
| `varchar`       | Text                                                                                         |
| `blob`          | Binary data                                                                                  |
| `uuid`          | [Universally unique identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier) |

### Nested Types

DuckLake supports nested types and primitive types. Nested types are defined recursively, i.e.,
in order to define a column of type `INT[]` two columns are defined. The top-level column is of type `list`, which has a child column of type `int32`.

The following nested types are supported:

| Type     | Description                                   |
| -------- | --------------------------------------------- |
| `list`   | Collection of values with a single child type |
| `struct` | A tuple of typed values                       |
| `map`    | A collection of key-value pairs               |
