---
layout: default
title: "The DuckLake Manifesto: SQL as a Lakehouse Format"
subtitle: An integrated data lake and catalog format
description: DuckLake delivers advanced data lake features without traditional lakehouse complexity by using Parquet files and your SQL database. It’s an open, standalone format from the DuckDB team.
body_class: manifesto
max_page_width: small
toc: false
---

<div class="wrap pagetitle">
  <h1>The DuckLake Manifesto:<br/> SQL as a Lakehouse Format</h1>
</div>

**Authors:** Mark Raasveldt and Hannes Mühleisen

DuckLake simplifies lakehouses by using a standard SQL database for all metadata, instead of complex file-based systems, while still storing data in open formats like Parquet. This makes it more reliable, faster, and easier to manage.

_Would you rather listen to the content of this manifesto? We also released a [podcast episode](https://www.youtube.com/watch?v=zeonmOO9jm4) explaining how we came up with the [DuckLake format](https://www.youtube.com/watch?v=zeonmOO9jm4)._

## Background

Innovative data systems like BigQuery and Snowflake have shown that *disconnecting storage and compute* is a great idea in a time where storage is a virtualized commodity. That way, both storage and compute can scale independently and we don't have to buy expensive database machines just to store tables we will never read.

At the same time, market forces have pushed people to insist that data systems *use open formats* like Parquet to avoid the all-too-common hostage taking of data by a single vendor. In this new world, lots of data systems happily frolic around a pristine “data lake” built on Parquet and S3 and all was well. Who needs those old school databases anyway!

But quickly it emerged that – shockingly – people would like to *make changes* to their dataset. Simple appends worked pretty well by just dropping more files into a folder, but anything beyond that required complex and error-prone custom scripts without any notion of correctness or – Codd beware – transactional guarantees.

![An actual lakehouse]({{ site.baseurl }}/images/manifesto/lakehouse.jpg)
*An actual lakehouse. Maybe more like a cabin on a lake.*{: .caption }

## Iceberg and Delta

To address the basic task of changing data in the lake, various new open standards emerged, most prominently Apache Iceberg and Linux Foundation Delta Lake. Both formats were designed to essentially recover some sanity of making changes to tables *without* giving up the basic premise: use open formats on blob storage. For example, Iceberg uses a maze of JSON and Avro files to define schemas, snapshots and which Parquet files are part of the table at a point in time. The result was christened the [“Lakehouse”](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf), effectively an addition of database features to data lakes that enabled a lot of new exciting use cases for data management, e.g., cross-engine data sharing.

![Iceberg table architecture]({{ site.baseurl }}/images/manifesto/iceberg-table-architecture.png){: .lightmode-img }
![Iceberg table architecture]({{ site.baseurl }}/images/manifesto/dark/iceberg-table-architecture.png){: .darkmode-img }
*Iceberg table architecture*{: .caption }

But both formats hit a snag in the road: finding the latest version of a table is tricky in blob stores with their mercurial consistency guarantees. It’s tricky to atomically (the “A” in ACID) swap a pointer to make sure everyone sees the latest version. Iceberg and Delta Lake also only really know about a single table, but people – again, shockingly – wanted to manage multiple tables.

## Catalogs

The solution was another layer of technology: we added a catalog service on top of the various files. That catalog service in turn talks to a *database* that manages all the table folder names. It also manages the saddest table of all time that only contains a single row for each table with the current version number. We can now borrow the database’s transactional guarantees around updating that number and everyone’s happy.

![Iceberg catalog architecture]({{ site.baseurl }}/images/manifesto/iceberg-catalog-architecture.png){: .lightmode-img }
![Iceberg catalog architecture]({{ site.baseurl }}/images/manifesto/dark/iceberg-catalog-architecture.png){: .darkmode-img }
*Iceberg catalog architecture*{: .caption }

## A Database You Say?

But here’s the problem: Iceberg and Delta Lake were specifically designed to *not* require a database. Their designers went to great lengths to encode all information needed to efficiently read and update tables into files on the blob store. They make many compromises to achieve this. For example, every single root file in Iceberg contains *all* existing snapshots complete with schema information, etc. For every single change, a new file is written that contains the complete history. A lot of other metadata had to be batched together, e.g., in the two-layer manifest files to avoid writing or reading too many small files, something that would not be efficient on blob stores. Making small changes to data is also a largely unsolved problem that requires complex cleanup procedures that are still not very well understood nor supported by open-source implementations. Entire companies exist and are still being started to solve this problem of managing fast-changing data. Almost as if a specialized data management system of sorts would be a good idea.

But as pointed out above, the Iceberg and Delta Lake designs *already* had to compromise and add a database as part of the catalog for consistency. However, they never revisited the rest of their design constraints and tech stack to adjust for this fundamental design change.

## DuckLake

Here at [DuckDB](https://duckdb.org/), we actually like databases. They are amazing tools to safely and efficiently manage fairly large datasets. Once a database has entered the Lakehouse stack anyway, it makes an insane amount of sense to also use it for managing the rest of the table metadata! We can still take advantage of the “endless” capacity and “infinite” scalability of blob stores for storing the actual table data in open formats like Parquet, but we can much more efficiently and effectively manage the metadata needed to support changes in a database! Coincidentally, this is also what Google BigQuery (with Spanner) and Snowflake (with FoundationDB) have chosen, just without the open formats at the bottom.

![DuckLake's architecture]({{ site.baseurl }}/images/manifesto/ducklake-architecture.png){: .lightmode-img }
![DuckLake's architecture]({{ site.baseurl }}/images/manifesto/dark/ducklake-architecture.png){: .darkmode-img }
*DuckLake's architecture: Just a database and some Parquet files*{: .caption }

To resolve the fundamental problems of the existing Lakehouse architecture, we have created a new open table format called DuckLake. DuckLake re-imagines what a “Lakehouse” format should look like by acknowledging two simple truths:

1. Storing *data* files in open formats on blob storage is a great idea for scalability and to prevent lock-in.
2. Managing metadata is a complex and interconnected data management task best left to a database management system.

The basic design of DuckLake is to *move all metadata structures into a SQL database*, both for catalog and table data. The format is defined as a set of relational tables and pure-SQL transactions on them that describe data operations like schema creation, modification, and addition, deletion and updating of data. The DuckLake format can manage an *arbitrary number* of tables with cross-table transactions. It also supports “advanced” database concepts like views, nested types, transactional schema changes etc.; see below for a list. One major advantage of this design is by leveraging referential consistency (the “C” in ACID), the schema makes sure there are e.g. no duplicate snapshot ids. 

![DuckLake schema]({{ site.baseurl }}/images/manifesto/ducklake-schema-1.png){: .lightmode-img }
![DuckLake schema]({{ site.baseurl }}/images/manifesto/dark/ducklake-schema-1.png){: .darkmode-img }
*DuckLake schema*{: .caption }

Which exact SQL database to use is up to the user, the only requirements are that the system supports ACID operations and primary keys along with standard SQL support. The DuckLake-internal table schema is intentionally kept simple in order to maximize compatibility with different SQL databases. Here is the core schema through an example.

Let's follow the sequence of queries that occur in DuckLake when running the following query on a new, empty table:

```sql
INSERT INTO demo VALUES (42), (43);
```

```sql
BEGIN TRANSACTION;
  -- some metadata reads skipped here
  INSERT INTO ducklake_data_file VALUES (0, 1, 2, NULL, NULL, 'data_files/ducklake-8196...13a.parquet', 'parquet', 2, 279, 164, 0, NULL, NULL);
  INSERT INTO ducklake_table_stats VALUES (1, 2, 2, 279);
  INSERT INTO ducklake_table_column_stats VALUES (1, 1, false, NULL, '42', '43');
  INSERT INTO ducklake_file_column_statistics VALUES (0, 1, 1, NULL, 2, 0, 56, '42', '43', NULL)
  INSERT INTO ducklake_snapshot VALUES (2, now(), 1, 2, 1);
  INSERT INTO ducklake_snapshot_changes VALUES (2, 'inserted_into_table:1');
COMMIT;
```

We see a single coherent SQL transaction that:

* Inserts the **new Parquet** file path
* Updates the global **table** statistics (now has more rows)
* Updates the global **column** statistics (now has a different minimum and maximum value)
* Updates the **file** column statistics (also record min/max among other things)
* Creates a new schema **snapshot** (#2)
* Logs the **changes** that happened in the snapshot

Note that the actual write to Parquet is not part of this sequence, it happens beforehand. But no matter how many values are added, this sequence has the same (low) cost.

Let's discuss the three principles of DuckLake: **Simplicity**, **Scalability** and **Speed**.

### Simplicity

DuckLake follows the DuckDB design principles of keeping things *simple and incremental*. In order to run DuckLake on a laptop, it is enough to just install DuckDB with the [`ducklake` extension](https://duckdb.org/docs/stable/core_extensions/ducklake). This is great for testing purposes, development and prototyping. In this case, the catalog store is just a local DuckDB file.

The next step is making use of *external storage systems*. DuckLake data files are immutable, it never requires modifying files in place or re-using file names. This allows use with almost any storage system. DuckLake supports integration with any storage system like local disk, local NAS, S3, Azure Blob Store, GCS, etc. The storage prefix for data files (e.g., `s3://mybucket/mylake/`) is specified when the metadata tables are created.

Finally, the SQL database that hosts the *catalog server* can be any halfway competent SQL database that supports ACID and primary key constraints. Most organizations will already have a lot of experience operating a system like that. This greatly simplifies deployment as no additional software stack is needed beyond the SQL database. Also, SQL databases have been heavily commoditized in recent years, there are innumerable hosted PostgreSQL services or even hosted DuckDB that can be used as the catalog store! Again, the lock-in here is very limited because transitioning does not require any table data movement, and the schema is simple and standardized.

There are no Avro or JSON files. There is no additional catalog server or additional API to integrate with. **It’s all just SQL.** We all know SQL.

### Scalability

DuckLake actually increases separation of concerns within a data architecture into *three parts*. Storage, compute and metadata management. Storage remains on purpose-built file storage (e.g., blob storage), DuckLake can scale infinitely in storage.

An arbitrary number of compute nodes are querying and updating the catalog database and then independently reading and writing from storage. DuckLake can scale infinitely regarding compute.

Finally, the catalog database needs to be able to run *only* the metadata transactions requested by the compute nodes. Their volume is several orders of magnitude smaller than the actual data changes. But DuckLake is not bound to a single catalog database, making it possible to migrate e.g. from PostgreSQL to something else as demand grows. In the end, DuckLake uses simple tables and basic, portable SQL. But don’t worry, a PostgreSQL-backed DuckLake will already be able to scale to hundreds of terabytes and thousands of compute nodes.

Again, this is the exact design used by BigQuery and Snowflake that successfully manage immense datasets already. And hey, nothing keeps you from using Spanner as the DuckLake catalog database if required.

### Speed

Just like DuckDB itself, DuckLake is very much about speed. One of the biggest pain points of Iceberg and Delta Lake is the involved sequence of file IO that is required to run the smallest query. Following the catalog and file metadata path requires many separate sequential HTTP requests. As a result, there is a lower bound to how fast reads or transactions can run. There is a lot of time spent in the critical path of transaction commits, leading to frequent conflicts and expensive conflict resolution. While caching can be used to alleviate some of these problems, this adds additional complexity and is only effective for “hot” data.

The unified metadata within a SQL database also allows for low-latency query planning. In order to read from a DuckLake table, a single query is sent to the catalog database, which performs the schema-based, partition-based and statistics-based pruning to essentially retrieve a list of files to be read from blob storage. There are no multiple round trips to storage to retrieve and reconstruct metadata state. There is also less that can go wrong, no S3 throttling, no failing requests, no retries, no not-yet consistent views on storage that lead to files being invisible, etc.

DuckLake is also able to improve the two biggest performance problems of data lakes: small changes and many concurrent changes.

For small changes, DuckLake will *dramatically reduce the number of small files* written to storage. There is no new snapshot file with a tiny change compared to the previous one, there is no new manifest file or manifest list. DuckLake even optionally allows *transparent inlining* of small changes to tables into actual tables directly in the metadata store! Turns out, a database system can be used to manage data, too. This allows for sub-millisecond writes and for improved overall query performance by reducing the number of files that have to be read. By writing many fewer files, DuckLake also greatly simplifies cleanup and compaction operations.

In DuckLake, table changes consist of two steps: staging the data files (if any) to storage, and then running a single SQL transaction in the catalog database. This greatly reduces the time spent in the critical path of transaction commits, there is only a single transaction to run. SQL databases are pretty good at de-conflicting transactions. This means that the compute nodes spend a much smaller amount of time in the critical path where conflicts can occur. This allows for much faster conflict resolution and for many more concurrent transactions. Essentially, DuckLake supports as many table changes as the catalog database can commit. Even the venerable Postgres can run thousands of transactions *per second*. One could run a thousand compute nodes running appends to a table at a one-second interval and it would work fine.

In addition, DuckLake snapshots are just a few rows added to the metadata store, allowing for many snapshots to exist at the same time. There is no need to proactively prune snapshots. Snapshots can also refer to *parts of a Parquet file*, allowing many more snapshots to exist than there are files on disk. Combined, this allows DuckLake to manage *millions of snapshots!*

### Features

DuckLake has all of your favorite Lakehouse features:

* **Arbitrary SQL:** DuckLake supports all the same vastness of SQL features that e.g. DuckDB supports.
* **Data Changes:** DuckLake supports efficient appends, updates and deletes to data.
* **Multi-Schema, Multi-Table:** DuckLake can manage an arbitrary number of schemas that each contain an arbitrary number of tables in the same metadata table structure.
* **Multi-Table Transactions:** DuckLake supports fully ACID-compliant transactions over all of the managed schemas, tables and their content.
* **Complex Types:** DuckLake supports all your favorite complex types like lists, arbitrarily nested.
* **Full Schema Evolution:** Table schemas can be changed arbitrarily, e.g., columns can be added, removed, or have their data types changed.
* **Schema-Level Time Travel and Rollback:** DuckLake supports full snapshot isolation and time travel, allowing to query tables as of a specific point in time.
* **Incremental Scans:** DuckLake supports retrieval of only the changes that occurred between specified snapshots.
* **SQL Views:** DuckLake supports the definition of lazily evaluated SQL-level views.
* **Hidden Partitioning and Pruning:** DuckLake is aware of data partitioning and table- and file-level statistics, allowing for early pruning of scans for maximum efficiency.
* **Transactional DDL:** Schema and table and view creation, evolution and removal are fully transactional.
* **Data Compaction Avoidance:** DuckLake requires far fewer compaction operations than comparable formats. DuckLake supports efficient compaction of snapshots.
* **Inlining:** When making small changes to the data, DuckLake can optionally use the catalog database to store those small changes directly to avoid writing many small files.
* **Encryption:** DuckLake can optionally encrypt all data files written to data store, allowing for *zero-trust data hosting*. Keys are managed by the catalog database.
* **Compatibility:** The data and (positional) deletion files that DuckLake writes to storage are fully compatible with Apache Iceberg allowing for metadata-only migrations.

## Conclusion

We released DuckLake v0.1 with the `ducklake` DuckDB extension as its first implementation.
We hope that you will find DuckLake useful in your data architecture – we are looking forward to your creative use cases!
