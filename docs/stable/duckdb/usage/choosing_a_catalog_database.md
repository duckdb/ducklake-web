---
layout: docu
title: Choosing a Catalog Database
---

You may choose different _catalog databases_ for your DuckLake.
The choice depends on several factors, including whether you need to use multiple clients, which database systems are available in your organization, etc.

On the technical side, consider the following:

* If you would like to perform **local data warehousing with a single client**, use [DuckDB](#duckdb) as the catalog database.
* If you would like to perform **local data warehousing using multiple local clients**, use [SQLite](#sqlite) as the catalog database.
* If you would like to operate a **multi-user lakehouse** with potentially remote clients, use [PostgreSQL](#postgresql) as the catalog database.
* If you would like to serve a **DuckDB catalog to multiple clients**, use the [Quack](#quack) protocol.

## DuckDB

DuckDB can, of course, natively connect to DuckDB database files.
So, to get started with using DuckDB _as your DuckLake catalog database,_ you only need to install the [`ducklake` extension](https://duckdb.org/docs/current/core_extensions/ducklake) and attach to your DuckLake:

```sql
INSTALL ducklake;

ATTACH 'ducklake:metadata.ducklake' AS my_ducklake;
USE my_ducklake;
```

Note that if you are using DuckDB as your catalog database, only one process can attach it at a time unless every process attaches it with `READ_ONLY`.
Multiple connections within that process can use the catalog.

## PostgreSQL

DuckDB can interact with a PostgreSQL database using the [`postgres` extension](https://duckdb.org/docs/current/core_extensions/postgres/overview).
Install the `ducklake` and the `postgres` extension, and attach to your DuckLake as follows:

```sql
INSTALL ducklake;
INSTALL postgres;

-- Make sure that the database `ducklake_catalog` exists in PostgreSQL
ATTACH 'ducklake:postgres:dbname=ducklake_catalog host=localhost' AS my_ducklake
    (DATA_PATH 'data_files/');
USE my_ducklake;
```

For details on how to configure the connection, see the [`postgres` extension's documentation](https://duckdb.org/docs/current/core_extensions/postgres/overview#configuration).

The `ducklake` and `postgres` extensions require PostgreSQL 12 or newer.

## SQLite

DuckDB can read and write a SQLite database file using the [`sqlite` extension](https://duckdb.org/docs/current/core_extensions/sqlite).
Install the `ducklake` and the `sqlite` extension, and attach to your DuckLake as follows:

```sql
INSTALL ducklake;
INSTALL sqlite;

ATTACH 'ducklake:sqlite:metadata.sqlite' AS my_ducklake
    (DATA_PATH 'data_files/');
USE my_ducklake;
```

SQLite allows only one writer at a time. DuckLake retries lock conflicts when using a SQLite catalog.
This allows a reasonable amount of multi-processing support (effectively hiding the single-writer model).

Use the `sqlite:` prefix or `META_TYPE 'sqlite'` when attaching a SQLite metadata file.
Do not rely on an unprefixed file being detected automatically.

## Quack

The [`quack` extension](https://duckdb.org/docs/current/quack/overview) allows multiple DuckLake clients to connect to a DuckDB catalog hosted by a Quack server.
In a separate server process, open the DuckDB file that will store the metadata, then start the server:

```sql
INSTALL ducklake;
LOAD ducklake;
INSTALL quack;
INSTALL httpfs;
LOAD httpfs;
LOAD quack;
CALL quack_serve('quack:localhost');
```

The default port is 9494.
Use the token returned by `quack_serve` to create a secret in the client process:

```sql
INSTALL ducklake;
INSTALL quack;
INSTALL httpfs;
LOAD httpfs;
LOAD quack;
CREATE SECRET (TYPE quack, TOKEN '⟨token⟩', SCOPE 'quack:localhost');

ATTACH 'ducklake:quack:localhost' AS my_ducklake
    (DATA_PATH '/path/to/shared/data_files/');
USE my_ducklake;
```

Clients also need access to the data files.
The data path is stored as written, and a relative `DATA_PATH` is resolved against each client's working directory.
Use an absolute path or an object storage URL so that all clients find the same files.
Use shared storage when clients run on different machines.
When the server has `ducklake` loaded, eligible commits use `ducklake_commit` on the server automatically.
Applications continue to use `COMMIT`.

Quack has the following limitations:

* Changes made with `set_option` are not undone by `ROLLBACK`.
* `PRAGMA database_size` reports `0 bytes` for the Quack metadata database.

## MySQL

> Warning There are a number of known issues with MySQL as a catalog for DuckLake. This is due to some limitations regarding the DuckDB MySQL connector. We therefore do not recommend to use MySQL as a catalog for DuckLake.

DuckDB can interact with a MySQL database using the [`mysql` extension](https://duckdb.org/docs/current/core_extensions/mysql).
Install the `ducklake` and the `mysql` extension, and attach to your DuckLake as follows:

```sql
INSTALL ducklake;
INSTALL mysql;

-- Make sure that the database `ducklake_catalog` exists in MySQL
ATTACH 'ducklake:mysql:db=ducklake_catalog host=localhost' AS my_ducklake
    (DATA_PATH 'data_files/');
USE my_ducklake;
```

For details on how to configure the connection, see the [`mysql` extension's documentation](https://duckdb.org/docs/current/core_extensions/mysql#configuration).

Using the `ducklake` and `mysql` extensions requires MySQL 8 or newer.
