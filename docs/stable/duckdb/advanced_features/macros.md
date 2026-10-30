---
layout: docu
title: Macros
---

DuckLake supports both scalar and table macros. Macros can be created using the standard [`CREATE MACRO` syntax](https://duckdb.org/docs/current/sql/statements/create_macro).

Macros are stored in the DuckLake metadata across three catalog tables: [`ducklake_macro`]({% link docs/stable/specification/tables/ducklake_macro.md %}), [`ducklake_macro_impl`]({% link docs/stable/specification/tables/ducklake_macro_impl.md %}), and [`ducklake_macro_parameters`]({% link docs/stable/specification/tables/ducklake_macro_parameters.md %}).

Macros support [time travel]({% link docs/stable/duckdb/usage/time_travel.md %}), so attaching at a previous snapshot will reflect the macros that existed at that point in time.

## Scalar Macros

Scalar macros return a single value.

```sql
CREATE MACRO add_values(a, b) AS a + b;
SELECT add_values(40, 2);
```

## Table Macros

Table macros return a table.

```sql
CREATE MACRO filtered_table(threshold) AS TABLE
    SELECT *
    FROM my_table
    WHERE value > threshold;
SELECT * FROM filtered_table(100);
```

## Default Parameters

Macros can define default values for parameters.

```sql
CREATE MACRO add_with_default(a, b := 10) AS a + b;
SELECT add_with_default(5);
```

Defaults can also be `NULL`, typed `NULL` values, or constant expressions that construct nested values:

```sql
CREATE MACRO value_or_default(a, b := NULL) AS coalesce(b, a);
SELECT value_or_default(5);

CREATE MACRO default_list_length(values_list := ['a', 'b']) AS len(values_list);
SELECT default_list_length();
```

`NULL` defaults and defaults that are not scalar constants require DuckLake format version 1.1.

## Typed Parameters

Macros can specify types for their parameters.

```sql
CREATE MACRO typed_add(a INTEGER, b INTEGER) AS a + b;
```

Nested parameter types, including `LIST`, `STRUCT`, and `MAP`, are supported with DuckLake format version 1.1:

```sql
CREATE MACRO list_length(values_list VARCHAR[]) AS len(values_list);
CREATE MACRO struct_value(value_struct STRUCT(i INTEGER)) AS value_struct.i;
CREATE MACRO map_value(value_map MAP(VARCHAR, INTEGER)) AS value_map['a'];
```

## Dropping Macros

Macros can be dropped using `DROP MACRO` or `DROP MACRO TABLE` for table macros.

```sql
DROP MACRO add_values;
DROP MACRO TABLE filtered_table;
```
