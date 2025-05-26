---
layout: default
subtitle: An integrated data lake and catalog format
description: DuckLake delivers advanced data lake features without traditional lakehouse complexity by using Parquet files and your SQL database. It’s an open, standalone format from the DuckDB team.
body_class: manifesto
max_page_width: small
---

<div class="wrap pagetitle">
  <h1>The DuckLake Manifesto:<br/> SQL as a Lakehouse Format</h1>
</div>

**Authors:** Mark Raasveldt and Hannes Mühleisen

DuckLake simplifies lakehouses by using a standard SQL database for all metadata, instead of complex file-based systems, while still storing data in open formats like Parquet. This makes it more reliable, faster, and easier to manage.

## Background

Innovative data systems like BigQuery and Snowflake have shown that *disconnecting storage and compute* is a great idea in a time where storage is a virtualized commodity. That way, both storage and compute can scale independently and we don't have to buy expensive database machines just to store tables we will never read.

At the same time, market forces have pushed people to insist that data systems *use open formats* like Parquet to avoid the all-too-common hostage taking of data by a single vendor. In this new world, lots of data systems happily frolic around a pristine “data lake” built on Parquet and S3 and all was well. Who needs those old school databases anyway!

But quickly it emerged that – shockingly – people would like to *make changes* to their dataset. Simple appends worked pretty well by just dropping more files into a folder, but anything beyond that required complex and error prone custom scripts without any notion of correctness or – Codd beware – transactional guarantees.

## Iceberg and Delta

To address the basic task of changing data in the lake, various new open standards emerged, most prominently Apache Iceberg and Linux Foundation Delta Lake. Both formats were designed to essentially recover some sanity of making changes to tables *without* giving up the basic premise: use open formats on blob storage. For example, Iceberg uses a maze of JSON and Avro files to define schemas, snapshots and which Parquet files are part of the table at a point in time. The result was christened the [“Lakehouse”](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf), effectively an addition of database features to data lakes that enabled a lot of new exciting use cases for data management, e.g. cross-engine data sharing.

![Iceberg table architecture]({{ site.baseurl }}/images/manifesto/iceberg-table-architecture.svg)  
*Iceberg table architecture*{: .caption }

But both formats hit a snag in the road: finding the latest version of a table is tricky in blob stores with their mercurial consistency guarantees. It’s tricky to atomically (the “A” in ACID) swap a pointer to make sure everyone sees the latest version. Iceberg and Delta Lake also only really know about a single table, but people – again, shockingly – wanted to manage multiple tables.

## Catalogs

The solution was another layer of technology: we added a catalog service on top of the various files. That catalog service in turn talks to a *database* that manages all the table folder names. It also manages the saddest table of all time that only contains a single row for each table with the current version number. We can now borrow the database’s transactional guarantees around updating that number and everyone’s happy.

![Iceberg catalog architecture]({{ site.baseurl }}/images/manifesto/iceberg-catalog-architecture.svg)  
*Iceberg catalog architecture*{: .caption }

## A database you say?

But here’s the problem: Iceberg and Delta Lake were specifically designed to *not* require a database. Their designers went to great lengths to encode all information needed to efficiently read and update tables into files on the blob store. They make many compromises to achieve this. For example, every single root file in Iceberg contains *all* existing snapshots complete with schema information etc. For every single change, a new file is written that contains the complete history. A lot of other metadata had to be batched together, e.g., in the two-layer manifest files to avoid writing or reading too many small files, something that would not be efficient on blob stores. Making small changes to data is also a largely unsolved problem that requires complex cleanup procedures that are still not very well understood nor supported by open-source implementations. Entire companies exist and are still being started to solve this problem of managing fast-changing data. Almost as if a specialized data management system of sorts would be a good idea.

But as pointed out above, the Iceberg and Delta Lake designs *already* had to compromise and add a database as part of the catalog for consistency. However, they never revisited the rest of their design constraints and tech stack to adjust for this fundamental design change.

## DuckLake

Here at [DuckDB](http://duckdb.org), we actually like databases. They are amazing tools to safely and efficiently manage fairly large datasets. Once a database has entered the Lakehouse stack anyway, it makes an insane amount of sense to also use it for managing the rest of the table metadata! We can still take advantage of the “endless” capacity and “infinite” scalability of blob stores for storing the actual table data in open formats like Parquet, but we can much more efficiently and effectively manage the metadata needed to support changes in a database! Coincidentally, this is also what Google BigQuery (with Spanner) and Snowflake (with FoundationDB) have chosen, just without the open formats at the bottom.

![DuckLake's architecture]({{ site.baseurl }}/images/manifesto/ducklake-architecture.svg)  
*DuckLake's architecture: Just a database and some Parquet files*{: .caption }

To resolve the fundamental problems of the existing Lakehouse architecture, we have created a new open table format called **“DuckLake”**. DuckLake re-imagines what a “Lakehouse” format should look like by acknowledging two simple truths:

- Storing *data* files in open formats on blob storage is a great idea for scalability and to prevent lock-in.
- Managing metadata is a complex and interconnected data management task best left to a database management system.

The basic design of DuckLake is to *move all metadata structures into a SQL database*, both for catalog and table data. The format is defined as a set of relational tables and pure-SQL transactions on them that describe data operations like schema creation, modification, and addition, deletion and updating of data. The DuckLake format can manage an *arbitrary number* of tables with cross-table transactions. It also supports “advanced” database concepts like views, nested types, transactional schema changes, etc., see below for a list. One major advantage of this design is by leveraging referential consistency (the “C” in ACID), the schema makes sure there are e.g. no duplicate snapshot ids.

![DuckLake schema]({{ site.baseurl }}/images/manifesto/ducklake-schema.svg)  
*DuckLake schema*{: .caption }