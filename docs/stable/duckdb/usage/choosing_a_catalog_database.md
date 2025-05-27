---
layout: docu
title: Choosing a Catalog Database
---

You may choose different _catalog databases_ for your DuckLake.
The choice depends on several factors, including whether you need to use multiple clients, which database systems are available in your organization, etc.

On the technical side, consider the following:

* If you would like to perform **local data warehousing with a single client**, use [DuckDB](#duckdb) as the catalog database.
* If you would like to perform **local data warehousing using multiple local clients**, use [SQLite](#sqlite) as the catalog database.
* If you would like to operate a **multi-user lakehouse** with potentially remote clients, choose a transactional client-server database system as the catalog database: [MySQL](#mysql) or [PostgreSQL](#postgresql).

## DuckDB

DuckDB can, of course, natively connect to DuckDB database files.
So, to get started, you only need to install the [`ducklake` extension](https://duckdb.org/docs/stable/core_extensions/ducklake) and attach to your DuckLake:

```sql
INSTALL ducklake;

ATTACH 'ducklake:metadata.ducklake' AS my_ducklake;
USE my_ducklake;
```

Note that if you are using DuckDB as your catalog database, you're limited to a single client.

## PostgreSQL

DuckDB can interact with a PostgreSQL database using the [`postgres` extension](https://duckdb.org/docs/stable/core_extensions/postgres).
Install the `ducklake` and the `postgres` extension, and attach to your DuckLake as follows:

```sql
INSTALL ducklake;
INSTALL postgres;

-- Make sure that the database `ducklake_catalog` exists in PostgreSQL.
ATTACH 'ducklake:postgres:dbname=ducklake_catalog host=localhost' AS my_ducklake;
USE my_ducklake;
```

For details on how to configure the connection, see the [`postgres` extension's documentation](https://duckdb.org/docs/stable/core_extensions/postgres#configuration).

The `ducklake` and `postgresql` extensions require PostgreSQL 12 or newer.

## SQLite

DuckDB can read and write a SQLite database file using the [`sqlite` extension](https://duckdb.org/docs/stable/core_extensions/sqlite).
Install the `ducklake` and the `sqlite` extension, and attach to your DuckLake as follows:

```sql
INSTALL ducklake;
INSTALL sqlite;

ATTACH 'ducklake:sqlite:metadata.sqlite' AS my_ducklake;
USE my_ducklake;
```

While SQLite doesn't allow concurrent reads and writes, its default mode is to `ATTACH` and `DETACH` for every query, together with providing a “retry time-out” for queries when a write-lock is encountered.
This allows a reasonable amount of multi-processing support (effectively hiding the single-writer model).

## MySQL

DuckDB can interact with a MySQL database using the [`mysql` extension](https://duckdb.org/docs/stable/core_extensions/mysql).
Install the `ducklake` and the `mysql` extension, and attach to your DuckLake as follows:

```sql
INSTALL ducklake;
INSTALL mysql;

-- Make sure that the database `ducklake_catalog` exists in MySQL
ATTACH 'ducklake:mysql:db=ducklake_catalog host=localhost' AS my_ducklake;
USE my_ducklake;
```

For details on how to configure the connection, see the [`mysql` extension's documentation](https://duckdb.org/docs/stable/core_extensions/mysql#configuration).

Using the `ducklake` and `mysql` extensions require MySQL 8 or newer.
