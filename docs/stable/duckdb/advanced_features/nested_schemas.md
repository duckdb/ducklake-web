---
layout: docu
title: Nested Schemas
---

DuckLake supports schemas inside other schemas.
Nested schemas require DuckLake format version 1.1.

## Examples

Create each parent schema before creating its children, and use the full schema path to access tables:

```sql
ATTACH 'ducklake:nested.ducklake' AS my_ducklake;
CREATE SCHEMA my_ducklake.sales;
CREATE SCHEMA my_ducklake.sales.europe;
CREATE TABLE my_ducklake.sales.europe.orders (order_id INTEGER, amount DECIMAL(10, 2));
INSERT INTO my_ducklake.sales.europe.orders VALUES (1, 25.00);
SELECT * FROM my_ducklake.sales.europe.orders;
```

Views and macros can also be created in nested schemas.
A quoted name containing a dot, such as `my_ducklake."sales.europe"`, names a single top-level schema and is distinct from `my_ducklake.sales.europe`.

Use `duckdb_schemas()` to list schemas and their parents:

```sql
SELECT schema_name, parent_schema
FROM duckdb_schemas()
WHERE database_name = 'my_ducklake'
ORDER BY schema_name;
```

`SHOW ALL TABLES` includes nested tables, but its `schema` column contains only the final component of the schema name.
`USE` and `SHOW TABLES FROM` do not accept paths containing multiple schema components.
Use fully qualified object names instead.

Functions that take a schema argument accept a dotted path:

```sql
CALL ducklake_flush_inlined_data('my_ducklake', schema_name => 'sales.europe');
CALL my_ducklake.set_option('parquet_compression', 'zstd', schema => 'sales.europe');
```

Schema options apply to tables directly in that schema and are not inherited by child schemas.
A nested schema's default directory uses its UUID under the DuckLake data path.
The directory layout does not mirror the schema hierarchy.

To drop a schema containing tables, views, macros, or child schemas, use `CASCADE`:

```sql
DROP SCHEMA my_ducklake.sales CASCADE;
```

Dropped schemas remain accessible through [time travel]({% link docs/stable/duckdb/usage/time_travel.md %}) while the relevant snapshots and data are retained.
