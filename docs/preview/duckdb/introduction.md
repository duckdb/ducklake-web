---
layout: docu
title: Introduction
---

In DuckDB, DuckLake is supported through the [`ducklake` extension](https://duckdb.org/docs/stable/core_extensions/ducklake).

## Installation

Install the latest stable [DuckDB](https://duckdb.org/install/).
(The `ducklake` extension requires DuckDB v1.3.0 “Ossivalis” or later.)

```sql
INSTALL ducklake;
```

## Configuration

To use DuckLake, you need to make two decisions: which [metadata catalog database you want to use]({% link docs/preview/duckdb/usage/choosing_a_catalog_database.md %}) and [where you want to store those files]({% link docs/preview/duckdb/usage/choosing_storage.md %}). In the simplest case, you use a local DuckDB file for the metadata catalog and a local folder on your computer for file storage.

## Creating a New Database

DuckLake databases are created by simply starting to use them with the [`ATTACH` statement](https://duckdb.org/docs/stable/sql/statements/attach#attach). In the simplest case, you can create a local, DuckDB-backed DuckLake like so:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake;
USE my_ducklake;
```

This will create a file `my_ducklake.ducklake`, which is a DuckDB database with the [DuckLake schema]({% link docs/preview/specification/tables/overview.md %}).

We also use `USE` so we don't have to prefix all table names with `my_ducklake`. Once data is inserted, this will also create a folder `my_ducklake.ducklake.files` in the same directory, where Parquet files are stored.

If you would like to use another directory, you can specify this in the `DATA_PATH` parameter for `ATTACH`:

```sql
ATTACH 'ducklake:my_other_ducklake.ducklake' AS my_other_ducklake (DATA_PATH 'some/other/path/');
USE ...;
```

The path is stored in the DuckLake metadata and does not have to be specified again to attach to an existing DuckLake catalog.

> Both `DATA_PATH` and the database file path should be relative paths (e.g., `./some/path/` or `some/path/`). Moreover, for database creation the path needs to exist already, i.e., `ATTACH 'ducklake:db/my_ducklake.ducklake' AS my_ducklake;` where `db` needs to be an existing directory.

## Attaching an Existing Database

Attaching to an existing database also uses the `ATTACH` syntax. For example, to re-connect to the example from the previous section in a new DuckDB session, we can just type:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake;
USE my_ducklake;
```

If you use the DuckDB [command line client](https://duckdb.org/docs/stable/clients/cli/overview), you can pass it the filename or URL of the DuckLake as an argument:

```batch
duckdb ducklake:my_ducklake.ducklake
```

## Using DuckLake

DuckLake is used just like any other DuckDB database. You can create schemas and tables, insert data, update data, delete data, modify table schemas, etc.

Note that – similarly to other data lake and lakehouse formats – the DuckLake format does not support indexes, primary keys, foreign keys, and `UNIQUE` or `CHECK` constraints.

Don't forget to either specify the database name of the DuckLake explicitly or use `USE`. Otherwise you might inadvertently use the temporary, in-memory database.

### Example

Let's observe what happens in DuckLake when we interact with a dataset. We will use the [Netherlands train traffic dataset](https://duckdb.org/2024/05/31/analyzing-railway-traffic-in-the-netherlands) here.

We use the example DuckLake from above:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake;
USE my_ducklake;
```

Let's now import the dataset into a new table:

```sql
CREATE TABLE nl_train_stations AS
    FROM 'https://blobs.duckdb.org/nl_stations.csv';
```

Now let's peek behind the curtains. The data was just read into a Parquet file, which we can also just query.

```sql
FROM glob('my_ducklake.ducklake.files/**/*');
FROM 'my_ducklake.ducklake.files/**/*.parquet' LIMIT 10;
```

But now let's change some things around. We're really unhappy with the old name of the "Amsterdam Bijlmer ArenA" station now that the stadium has been renamed to "Johan Cruijff ArenA" and everyone here loves [Johan](https://en.wikipedia.org/wiki/Johan_Cruyff). So let's change that.

```sql
UPDATE nl_train_stations
SET name_long = 'Johan Cruijff ArenA'
WHERE code = 'ASB';
```

Poof, it's changed. We can confirm:

```sql
SELECT name_long
FROM nl_train_stations
WHERE code = 'ASB';
```

In the background, more files have appeared:

```sql
FROM glob('my_ducklake.ducklake.files/**/*');
```

We now see three files. The original data file, the rows that were deleted, and the rows that were inserted. Like most systems, DuckLake models updates as deletes followed by inserts. The deletes are just a Parquet file, we can query it:

```sql
FROM 'my_ducklake.ducklake.files/**/ducklake-*-delete.parquet';
```

The file should contain a single row that marks row 29 as deleted. A new file has appeared that contains the new values for this row.

There are now three snapshots, the table creation, data insertion, and the update. We can query that using the `snapshots()` function:

```sql
FROM my_ducklake.snapshots();
```

And we can query this table at each point:

```sql
SELECT name_long
FROM nl_train_stations AT (VERSION => 1)
WHERE code = 'ASB';
```

```sql
SELECT name_long
FROM nl_train_stations AT (VERSION => 2)
WHERE code = 'ASB';
```

Time travel finally achieved!

### Detaching from a DuckLake

To detach from a DuckLake, make sure that your DuckLake is not your default database, then use the [`DETACH` statement](https://duckdb.org/docs/stable/sql/statements/attach#detach):

```sql
USE memory;
DETACH my_ducklake;
```

## Using DuckLake from a Client

DuckLake works with any [DuckDB client](https://duckdb.org/docs/stable/clients/overview) that supports DuckDB version 1.3.0.
