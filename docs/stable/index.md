---
layout: docu
copy_markdown: false
redirect_from:
- /docs
- /docs/
title: Documentation
---

Welcome to the DuckLake documentation. This documentation has two parts:

* **[The DuckLake specification]({% link docs/stable/specification/introduction.md %}):** The specification of the DuckLake lakehouse format. It describes the SQL tables and queries used to define the catalog database.
* **[The `ducklake` DuckDB extension]({% link docs/stable/duckdb/introduction.md %}):** User guide for the `ducklake` DuckDB extension. It presents the features of DuckLake through examples.

## When Should I Use DuckLake?

DuckLake provides a lightweight one-stop solution if you need a _lakehouse,_ i.e., a data lake with a catalog.
DuckLake has all the features provided by lakehouse formats: you can run [time travel queries]({% link docs/stable/duckdb/usage/time_travel.md %}),
exploit [data partitioning]({% link docs/stable/duckdb/advanced_features/partitioning.md %}), perform [schema evolution]({% link docs/stable/duckdb/usage/schema_evolution.md %}),
and can store your data in multiple files instead of using a single (potentially very large) database file, that works well with object storage (e.g., Amazon S3).

If you use DuckLake from [DuckDB]({% link docs/stable/duckdb/introduction.md %}), you can use it to achieve a “multiplayer DuckDB” setup with multiple processes reading and writing the same dataset – a concurrency model [currently not supported by DuckDB's native database format](https://duckdb.org/docs/current/connect/concurrency).

## List of DuckLake Clients

The [`ducklake` DuckDB extension]({% link docs/stable/duckdb/introduction.md %}) serves as the reference implementation for DuckLake clients.
Additionally, DuckLake currently has implementations for the following libraries (at various levels of maturity):

* [DataFusion](https://github.com/datafusion-contrib/datafusion-ducklake)
* [Spark](https://github.com/motherduckdb/ducklake-spark)
* [Trino awitten1/trino-ducklake](https://github.com/awitten1/trino-ducklake)
* [Trino brikk/trino-ducklake](https://github.com/brikk/ducklake-integrations/tree/main/jvm/trino-ducklake)
* [PostgreSQL (`pg_ducklake`)](https://github.com/relytcloud/pg_ducklake)

## List of Hosted DuckLakes

MotherDuck offers a [hosted solution for DuckLake v1.0](https://motherduck.com/blog/announcing-ducklake-1-0-on-motherduck/), currently in public preview.

For hosting read-only DuckLakes, see the guide for creating a [“Public DuckLake on Object Storage”]({% link docs/stable/duckdb/guides/public_ducklake_on_object_storage.md %}).

## Single File Documentation

You can download the documentation as a single file:

* [DuckLake documentation in Markdown](https://blobs.duckdb.org/docs/ducklake-docs.md)
* [DuckLake documentation as a PDF](https://blobs.duckdb.org/docs/ducklake-docs.pdf)
