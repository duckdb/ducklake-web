---
layout: docu
title: Introduction
---

This page contains the specification for the DuckLake format, version 1.1.

## Building Blocks

DuckLake requires two main components:

* **Catalog database:** DuckLake requires a database that supports transactions and primary key constraints as defined by the [SQL-92 standard](https://en.wikipedia.org/wiki/SQL-92).
* **Data storage:** The DuckLake specification requires a storage component for storing the data in [Parquet format](https://parquet.apache.org/docs/file-format/).

### Catalog Database

DuckLake uses SQL tables and queries to define the catalog information (metadata, statistics, etc.).
This specification explains the schema and semantics of these:

* [Data Types]({% link docs/stable/specification/data_types.md %})
* [Queries]({% link docs/stable/specification/queries.md %})
* [Tables]({% link docs/stable/specification/tables/overview.md %})

If you are reading this specification for the first time,
we recommend starting with the [“Queries” page]({% link docs/stable/specification/queries.md %}),
which introduces the queries used by DuckLake.

In DuckDB, attaching a 1.0 catalog with `AUTOMATIC_MIGRATION TRUE` migrates it to 1.1.
Without this option, the catalog remains at 1.0.
The migration adds the 1.1 catalog columns and the `ducklake_view_column_tag` table, and renames the system columns in registered [inlined data tables]({% link docs/stable/specification/tables/ducklake_inlined_data_tables.md %}).
It also repairs existing metadata: it adds missing `ducklake_schema_versions` rows for inlined data tables, restores the defaults of renamed struct fields, and clears column bounds that older versions may have stored with the wrong type.
The added columns are `NULL` for existing rows.

### Data Storage

DuckLake uses [Parquet](https://parquet.apache.org/docs/file-format/) files to represent its tables.
These files can be stored in [object storage (blob storage)](https://en.wikipedia.org/wiki/Object_storage), block storage, or file storage.
