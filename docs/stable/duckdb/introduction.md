---
layout: docu
title: Introduction
redirect_from:
- /docs/stable/duckdb
- /docs/stable/duckdb/
---

In DuckDB, DuckLake is supported through the [`ducklake` extension](https://duckdb.org/docs/stable/core_extensions/ducklake).

## Installation

Install the latest stable [DuckDB](https://duckdb.org/docs/installation/).
(The `ducklake` extensions requires DuckDB v1.3.0 "Ossivalis" or later.)

```sql
INSTALL ducklake;
```

## Configuration

To use DuckLake, you need to make two decisions: which [metadata catalog database you want to use]({% link docs/stable/duckdb/usage/choosing_a_catalog_database.md %}) and [where you want to store those files]({% link docs/stable/duckdb/usage/choosing_storage.md %}). In the simplest case, you use a local DuckDB file for the metadata catalog and a local folder on your computer for file storage.

## Creating a New Database

DuckLake databases are created by simply starting to use them with the [`ATTACH` statement](https://duckdb.org/docs/stable/sql/statements/attach#attach). In the simplest case, you can create a local, DuckDB-backed DuckLake like so:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake;
USE my_ducklake;
```

This will create a file `my_ducklake.ducklake`, which is a DuckDB database with the [DuckLake schema](% link docs/stable/specification/tables/overview.md %). 

We also use `USE` so we don't have to prefix all table names with `my_ducklake`. Once data is inserted, this will also create a folder `my_ducklake.ducklake.files` in the same directory, where Parquet files are stored.

If you would like to use another directory, you can specify this in the `DATA_PATH` parameter for `ATTACH`:

```sql
ATTACH 'ducklake:my_other_ducklake.ducklake' AS my_other_ducklake (DATA_PATH 'some/other/path');
USE ...;
```

The path is stored in the DuckLake metadata and does not have to be specified again to attach to an existing DuckLake catalog.

## Attaching an Existing Database

Attaching to an existing database also uses the `ATTACH` syntax. For example, to re-connect to the example from the previous section in a new DuckDB session, we can just type:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake;
USE my_ducklake;
```

## Using DuckLake

DuckLake is used just like any other DuckDB database. You can create schemas and tables, insert data, update data, delete data, modify table schemas etc.

Note that – similarly to other data lake and lakehouse formats – the DuckLake format does not support indexes, primary keys, foreign keys, and `UNIQUE` or `CHECK` constraints.

### Running Queries in DuckLake

A DuckLake database behaves just like any other database in DuckDB. For example, you can run:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake (DATA_PATH 'x/');
USE my_ducklake;

CREATE TABLE nl_train_stations AS
    FROM 'https://blobs.duckdb.org/nl_stations.csv';

SELECT code, name_long
FROM nl_train_stations
WHERE name_long LIKE 'Amsterdam%';
LIMIT 3;
```

And obtain the following result:

```text
┌─────────┬─────────────────────────┐
│  code   │        name_long        │
│ varchar │         varchar         │
├─────────┼─────────────────────────┤
│ ASA     │ Amsterdam Amstel        │
│ ASB     │ Amsterdam Bijlmer ArenA │
│ ASD     │ Amsterdam Centraal      │
└─────────┴─────────────────────────┘
```

### Detaching from a DuckLake

To detach from a DuckLake, make sure that your DuckLake is not your default database, then use the [`DETACH` statement](https://duckdb.org/docs/stable/sql/statements/attach#detach):

```sql
USE memory;
DETACH my_ducklake;
```

## Using DuckLake from a Client

DuckDB works with any [DuckDB client](https://duckdb.org/docs/stable/clients/overview) that supports DuckDB version 1.3.0.
