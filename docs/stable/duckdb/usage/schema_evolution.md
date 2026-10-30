---
layout: docu
title: Schema Evolution
---

DuckLake supports the evolution of the schemas of tables without requiring any data files to be rewritten. The schema of a table can be changed using the `ALTER TABLE` statement. The following statements are supported:

## Adding Columns / Fields

To add a new column of type `INTEGER`, with default value `NULL`, use:

```sql
ALTER TABLE tbl ADD COLUMN new_column INTEGER;
```

To add a new column with an explicit default value, use:

```sql
ALTER TABLE tbl ADD COLUMN new_column VARCHAR DEFAULT 'my_default';
```

Fields can be added to columns of type `struct`. The path to the `struct` column must be specified, followed by the name of the new field and the type of the new field.

```sql
-- Add a new field of type INTEGER, with default value NULL
ALTER TABLE tbl ADD COLUMN nested_column.new_field INTEGER;
```

For structs inside lists or maps, include `element`, `key`, or `value` in the field path, e.g., `ALTER TABLE tbl ADD COLUMN list_column.element.new_field INTEGER;`.
`ADD COLUMN` supports literal defaults, including casts of literals, but not expression defaults such as `now()`.

## Dropping Columns / Fields

To drop the top-level column `new_column` from the table, use:

```sql
ALTER TABLE tbl DROP COLUMN new_column;
```

If the column is used in the table's [sort order]({% link docs/stable/duckdb/advanced_features/sorted_tables.md %}), reset or change the sort order before dropping it.

Fields can be dropped by specifying the full path to the field.
For example, to drop the field `new_field` from the struct column `nested_column`, use:

```sql
ALTER TABLE tbl DROP COLUMN nested_column.new_field;
```

The last field of a struct cannot be dropped. Drop the containing column or field instead.

### Renaming Columns / Fields

To rename the top-level column `new_column` to `new_name`, use:

```sql
ALTER TABLE tbl RENAME new_column TO new_name;
```

Fields can be renamed by specifying the full path to the field.
For example, to rename the field `new_field` within the struct column `nested_column` to `new_name`:

```sql
ALTER TABLE tbl RENAME nested_column.new_field TO new_name;
```

### Renaming Tables

To rename the table `tbl` to `tbl_new_name`, use:

```sql
ALTER TABLE tbl RENAME TO tbl_new_name;
```

## Type Promotion

The [types]({% link docs/stable/specification/data_types.md %}) of columns can be changed.

To change the type of `col1` to `BIGINT`, use:

```sql
ALTER TABLE tbl ALTER col1 SET TYPE BIGINT;
```

To change the type of field `new_field` within the struct column `nested_column` to `BIGINT`, specify the type of the entire struct column:

```sql
ALTER TABLE tbl ALTER nested_column SET TYPE STRUCT(new_field BIGINT, other_field VARCHAR);
```

This example assumes that `nested_column` has fields `new_field` and `other_field`.
Directly targeting a nested field with `ALTER ... TYPE` is not supported.

Note that not all type changes are valid. Only _type promotions_ are supported.
The extension uses DuckDB's widening type rules, such as promoting from a narrower type (`int32`) to a wider type (`int64`).

Examples of valid type promotions are as follows:

| Source    | Target                       |
| --------- | ---------------------------- |
| `int8`    | `int16`, `int32`, `int64`, `int128`, `float32`, `float64` |
| `int16`   | `int32`, `int64`, `int128`, `float32`, `float64` |
| `int32`   | `int64`, `int128`, `float32`, `float64` |
| `int64`   | `int128`, `float32`, `float64` |
| `uint8`   | `uint16`, `uint32`, `uint64` |
| `uint16`  | `uint32`, `uint64`           |
| `uint32`  | `uint64`                     |
| `float32` | `float64`                    |
| `timestamp` | `timestamptz`               |
| `null`    | A supported scalar type       |

Promotions to floating-point types are accepted even when they can lose precision, such as `int64` to `float32`.

The `null` type requires DuckLake format version 1.1 and can only store `NULL` values until promoted.
It cannot be promoted to a nested type such as `struct`, `list`, or `map`.

Changing a nested type can add or remove struct fields and promote existing fields, including fields inside lists and maps.
Existing fields retain their order even if the target type lists them in another order.
New fields are appended.

## Changing Defaults

Expression defaults are supported in `CREATE TABLE` and when changing the default of a committed column.
For a new column, add it first and commit before setting an expression default:

```sql
ALTER TABLE tbl ADD COLUMN created_at TIMESTAMP;
ALTER TABLE tbl ALTER created_at SET DEFAULT now();
```

Run these statements in separate transactions, as they are in DuckDB's default autocommit mode.
Existing rows keep `NULL`.
The new default applies to subsequent inserts.
Defaults on nested columns and `ALTER ... SET DEFAULT` on nested fields are not supported.

## Field Identifiers

Columns are tracked using **field identifiers**. These identifiers are stored in the `column_id` field of the [`ducklake_column` table]({% link docs/stable/specification/tables/ducklake_column.md %}).
The identifiers are also written to each of the data files created by DuckLake.
For Parquet files, these are written in the [`field_id`](https://github.com/apache/parquet-format/blob/f1fd3b9171aec7a7f0106e0203caef88d17dda82/src/main/thrift/parquet.thrift#L550) field.
These identifiers are used to reconstruct the data of a table for a given snapshot.

When reading the data for a table, the schema together with the correct field identifiers is read from the [`ducklake_column` table]({% link docs/stable/specification/tables/ducklake_column.md %}).
Data files can contain any number of columns that exist in that schema, and can also contain columns that do not exist in that schema.

- If we drop a column, previously written data files still contain the dropped column.
- If we add a column, previously written data files do not contain the new column.
- If we change the type of a column, previously written data files contain data for the column in the old type.

To reconstruct the correct table data for a given snapshot, we must perform _field id remapping_. This is done as follows:

- Data for a column is read from the column with the corresponding `field_id`. The data types might not match in case of type promotion. In this case, the values must be cast to the correct type of the column.
- Any column that has a `field_id` that exists in the data file but not in the table schema must be ignored
- Any column that has a `field_id` that does not exist in the data file must be replaced with the `initial_default` value in the [`ducklake_column` table]({% link docs/stable/specification/tables/ducklake_column.md %})
