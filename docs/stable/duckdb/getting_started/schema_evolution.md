---
layout: docu
title: Schema Evolution
---

DuckLake supports the evolution of the schemas of tables without requiring any data files to be rewritten. The following schema evolution operations are supported:

* Columns can be added to a table
* Columns can be removed from a table
* Columns can be renamed
* Primitive column types can be changed
* Fields can be added to nested columns
* Fields can be removed from nested columns
* Fields in nested types can be renamed

#### Field Identifiers

Columns are tracked using **field identifiers**. These identifiers are stored in the `column_id` field of the `ducklake_column` table.
The identifiers are also written to each of the data files. For Parquet files, these are written in the `[field_id](https://github.com/apache/parquet-format/blob/f1fd3b9171aec7a7f0106e0203caef88d17dda82/src/main/thrift/parquet.thrift#L550)` field.
These identifiers are used to reconstruct the data of a table for a given snapshot.

When reading the data for a table, the schema together with the correct field identifiers is read from the `ducklake_column` table.
Data files can contain any number of columns that exist in that schema, and can also contain columns that do not exist in that schema.

* If we drop a column, previously written data files still contain the dropped column.
* If we add a column, previously written data files do not contain the new column.
* If we change the type of a column, previously written data files contain data for the column in the old type.

To reconstruct the correct table data for a given snapshot, we must perform *field id remapping*. This is done as follows:

* Data for a column is read from the column with the corresponding `field_id`. The data types might not match in case of type promotion. In this case, the values must be cast to the correct type of the column.
* Any column that has a `field_id` that exists in the data file but not in the table schema must be ignored
* Any column that has a `field_id` that does not exist in the data file must be replaced with the `initial_default` value in the `ducklake_column` table


### Alter Table
The schema of a table can be changed using the `ALTER TABLE` statement. The following statements are supported:

#### Adding Columns / Fields

```sql
-- add a new column of type INTEGER, with default value NULL
ALTER TABLE tbl ADD COLUMN new_column INTEGER;
-- add a new column with an explicit default value
ALTER TABLE tbl ADD COLUMN new_column VARCHAR DEFAULT 'my_default';
```

Fields can be added to columns of type `struct`. The path to the `struct` column must be specified, followed by the name of the new field and the type of the new field.

```sql
-- add a new field of type INTEGER, with default value NULL
ALTER TABLE tbl ADD COLUMN nested_column.new_field INTEGER;
```

#### Dropping Columns / Fields

```sql
-- drop the top-level column `new_column` from the table
ALTER TABLE tbl DROP COLUMN new_column;
```

Fields can be dropped by specifying the full path to the field.

```sql
-- drop the field `new_field` from the struct column `nested_column`
ALTER TABLE tbl DROP COLUMN nested_column.new_field;
```

#### Renaming Columns / Fields

```sql
-- rename the top-level column "new_column" to "new_name"
ALTER TABLE tbl RENAME new_column TO new_name;
```

Field scan be renamed by specifying the full path to the field.

```sql
-- rename the field "new_field" within the struct column "nested_column" to "new_name"
ALTER TABLE tbl RENAME nested_column.new_field TO new_name;
```

#### Type Promotion

The types of columns can be changed.

```sql
-- change the type of col1 to BIGINT
ALTER TABLE tbl ALTER col1 SET TYPE BIGINT;
-- change the type of field "new_field" within the struct column "nested_column" to BIGINT
ALTER TABLE tbl ALTER nested_column.new_field SET TYPE BIGINT;
```

Note that not all type changes are valid. Only *type promotions* are supported.
Type promotions must be lossless. As such, valid type promotions are promoting from a narrower type (`int32`) to a wider type (`int64`). 

The full set of valid type promotions is as follows:

| Source  |         Target         |
|---------|------------------------|
| int8    | int16, int32, int64    |
| int16   | int32, int64           |
| int32   | int64                  |
| uint8   | uint16, uint32, uint64 |
| uint16  | uint32, uint64         |
| uint32  | uint64                 |
| float32 | float64                |
