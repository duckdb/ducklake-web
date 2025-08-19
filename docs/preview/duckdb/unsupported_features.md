---
layout: docu
title: Unsupported Features
---

This page describes what is supported in DuckDB and DuckLake in relation to DuckDB standalone (i.e., `:memory:` or DuckDB file modes). We can make a distinction between:

- What is **currently** not supported by the DuckLake specification. These are features that you are supported by DuckDB when using DuckDB's native database format but will not work with a DuckLake backend since the specification does not support them.

- What is **currently** not supported by the `ducklake` DuckDB extension. These are features that are supported by the DuckLake specification but are not (yet) implemented in the DuckDB extension.

## Unsupported by the DuckLake Specification

Within this group, we are going to make a distinction between what is not supported now but is likely to be supported in the future and what is not supported and is unlikely to be supported.

### Likely to be Supported in the Future

- [User defined types](https://duckdb.org/docs/stable/sql/statements/create_type)

- [Geometry/Geospatial types](https://duckdb.org/docs/stable/core_extensions/spatial/overview)

- Fixed-size arrays, i.e., [`ARRAY` type](https://duckdb.org/docs/stable/sql/data_types/array)

- Variant types

- [`CHECK` constraints](https://duckdb.org/docs/stable/sql/constraints#check-constraint). Not to be confused with Primary or Foreign Key constraint.

- [Scalar and table macros](https://duckdb.org/docs/stable/sql/statements/create_macro#examples). However, if the catalog DB supports it, there is a workaround.

    ```sql
    -- Using DuckDB as a catalog, create the macro in the catalog
    USE __ducklake_metadata_my_ducklake;
    CREATE MACRO add_and_multiply(a, b, c) AS (a + b) * c;

    -- Use the macro to create a table in DuckLake
    CREATE TABLE my_ducklake.table_w_macro AS
        SELECT add_and_multiply(1, 2, 3) AS col;
    ```

- Default values that are not literals. See the following example:

    ```sql
    -- This is allowed
    CREATE TABLE t1 (id INTEGER, d DATE DEFAULT '2025-08-08');

    -- This is not allowed
    CREATE TABLE t1 (id INTEGER, d DATE DEFAULT now());
    ```

- Dropping dependencies, such as views, when calling `DROP ... CASCADE`. Note that this is also a [DuckDB limitation](https://duckdb.org/docs/stable/sql/statements/drop#dependencies-on-views).

- [Generated columns](https://duckdb.org/docs/stable/sql/statements/create_table.html#generated-columns)

### Unlikely to be Supported in the Future

- [Indexes](https://duckdb.org/docs/stable/sql/indexes)

- [Primary key or enforced unique constraints](https://duckdb.org/docs/stable/sql/constraints#primary-key-and-unique-constraint) and [foreign key constraints](https://duckdb.org/docs/stable/sql/constraints#foreign-keys) are unlikely to be supported as these are constraints are prohibitively expensive to enforce in data lake setups. We may consider supporting unenforced primary keys, similar to [BigQuery's implementation](https://cloud.google.com/bigquery/docs/primary-foreign-keys).

- [Sequences](https://duckdb.org/docs/stable/sql/statements/create_sequence)

- [`VARINT` type](https://duckdb.org/docs/stable/sql/data_types/numeric#variable-integer)

- [`BITSTRING` type](https://duckdb.org/docs/stable/sql/data_types/bitstring)

- [`UNION` type](https://duckdb.org/docs/stable/sql/data_types/union)

## Unsupported by the `ducklake` DuckDB Extension

The following features are currently unsupported by the `ducklake` DuckDB extension: 

- [Data inlining]({% link docs/stable/duckdb/advanced_features/data_inlining.md %}) is limited to DuckDB catalogs

- MySQL catalogs are not fully supported in the DuckDB extension

- Updates that target the same row multiple times
