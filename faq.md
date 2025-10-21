---
layout: default
title: Frequently Asked Questions
body_class: faq
toc: false
---

<!-- ################################################################################# -->
<!-- ################################################################################# -->
<!-- ################################################################################# -->

<div class="wrap pagetitle">
  <h1>Frequently Asked Questions</h1>
</div>

## Overview




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Why should I use DuckLake?

<div class="answer" markdown="1">

DuckLake provides a lightweight one-stop solution if you need a data lake and catalog.

You can use DuckLake for a “multiplayer DuckDB” setup with multiple DuckDB instances reading and writing the same dataset –
a concurrency model [not supported by vanilla DuckDB](https://duckdb.org/docs/stable/connect/concurrency).

If you only use DuckDB for both your DuckLake entry point and your catalog database, you can still benefit from DuckLake:
you can run [time travel queries]({% link docs/stable/duckdb/usage/time_travel.md %}),
exploit [data partitioning]({% link docs/stable/duckdb/advanced_features/partitioning.md %}),
and can store your data in multiple files instead of using a single (potentially very large) database file.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Is DuckLake an open table format?

<div class="answer" markdown="1">

DuckLake is both a _lakehouse format_ and an _open table format._
When comparing to other technologies, DuckLake is similar to Delta Lake with Unity Catalog and Iceberg with Lakekeeper or Polaris.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is “DuckLake”?

<div class="answer" markdown="1">

“DuckLake” can refer to a number of things:

1. The _DuckLake lakehouse format_ that uses a catalog database and a Parquet storage to store data.
2. A _DuckLake instance_ storing a dataset with the DuckLake lakehouse format.
3. The [`ducklake` _DuckDB extension_]({% link docs/stable/duckdb/introduction.md %}), which supports reading/writing datasets using the DuckLake format.

</div>

</div>





<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Where can I download the DuckLake logo?

<div class="answer" markdown="1">

You can download the [logo package]({% link images/logo/DuckLake_Logo-package.zip %}).
You can also download individual logos:

* Dark mode, inline layout: [png]({% link images/logo/DuckLake-dark-inline.png %}), [svg]({% link images/logo/DuckLake-dark-inline.svg %})
* Dark mode, stacked layout: [png]({% link images/logo/DuckLake-dark-stacked.png %}), [svg]({% link images/logo/DuckLake-dark-stacked.svg %})
* Light mode, inline layout: [png]({% link images/logo/DuckLake-light-inline.png %}), [svg]({% link images/logo/DuckLake-light-inline.svg %})
* Light mode, stacked layout: [png]({% link images/logo/DuckLake-light-stacked.png %}), [svg]({% link images/logo/DuckLake-light-stacked.svg %})

</div>

</div>





## Architecture




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What are the main components of DuckLake?

<div class="answer" markdown="1">

DuckLake needs a storage layer and a catalog database.
Both components can be picked from a wide range of options.
The storage system can a blob storage (object storage), a block storage or a file storage.
For the catalog database, any SQL-compatible database works that supports ACID operations and primary keys.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Does DuckLake work on AWS S3 (or a compatible storage)?

<div class="answer" markdown="1">

DuckLake can store the _data files_ (Parquet files) on the AWS S3 blob storage or compatible solutions such as Azure Blob Storage, Google Cloud Storage or Cloudflare R2.
You can run the _catalog database_ anywhere, e.g., in an AWS Aurora database.

</div>

</div>





## DuckLake in Operation




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Is DuckLake production-ready?

<div class="answer" markdown="1">

While we tested DuckLake extensively, it is not yet production-ready as demonstrated by its version number {{ site.stable_ducklake_version }}.
We expect DuckLake to mature over the course of 2025.

</div>

</div>





<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How is authentication implemented in DuckLake?

<div class="answer" markdown="1">

DuckLake piggybacks on the authentication of the metadata catalog database. For example, if your catalog database is PostgreSQL, you can use PostgreSQL's [authentication](https://www.postgresql.org/docs/current/auth-methods.html) and [authorization](https://www.postgresql.org/docs/current/ddl-priv.html) [methods](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) to protect your DuckLake. This is particularly effective when enabling encryption of DuckLake files.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How does DuckLake deal with the “small files problem”?

<div class="answer" markdown="1">

The “small files problem” is a well-known problem in data lake formats and occurs e.g. when data is inserted in small batches,
yielding many small files with each storing only a small amount of data.
DuckLake significantly mitigates this problem by storing the metadata in a database system (catalog database) and making the compaction step simple.
DuckLake also harnesses the catalog database to stage data (a technique called “data inlining”) before serializing it into Parquet files.
Further improvements are on the roadmap.

</div>

</div>









## Features




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are constraints such as primary keys and foreign keys supported?

<div class="answer" markdown="1">

No. Similarly to other lakehouse technologies, DuckLake does not support constraints, keys, or indexes.
For more information, see the [list of unsupported features]({% link docs/stable/duckdb/unsupported_features.md %}).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Can I export my DuckLake into other formats?

<div class="answer" markdown="1">

Yes. Starting with v0.3, you can copy from [DuckLake to Iceberg]({% post_url 2025-09-17-ducklake-03 %}#interoperability-with-iceberg).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are DuckDB database files supported as the _data files_ for DuckLake?

<div class="answer" markdown="1">

The data files of DuckLake must be stored in Parquet.
Using DuckDB files as storage are not supported at the moment.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are there any practical limits to the size of data and the number of snapshots?

<div class="answer" markdown="1">

No. The only limitation is the catalog database's performance but even with a relatively slow catalog database, you can have terabytes of data and millions of snapshots.

</div>

</div>





## Development




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How is DuckLake tested?

<div class="answer" markdown="1">

DuckLake receives extensive testing, including running the applicable subset of [DuckDB's thorough test suite](https://duckdb.org/why_duckdb#thoroughly-tested).
That said, if you encounter any problems using DuckLake, please submit an issue in the [DuckLake issue tracker](https://github.com/duckdb/ducklake/issues).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How can I contribute to DuckLake?

<div class="answer" markdown="1">

If you encounter any problems using DuckLake, please submit an issue in the [DuckLake issue tracker](https://github.com/duckdb/ducklake/issues).
If you have any suggestions or feature requests, please open a ticket in [DuckLake's discussion forum](https://github.com/duckdb/ducklake/discussions).
You are also welcome to implement support in other systems for DuckLake following the [specification]({% link docs/stable/specification/introduction.md %}).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is the license of DuckLake?

<div class="answer" markdown="1">

The [DuckLake specification]({% link docs/stable/specification/introduction.md %}) and the [`ducklake` DuckDB extension]({% link docs/stable/duckdb/introduction.md %}) are released under the MIT license.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Is the documentation available as a single file?

<div class="answer" markdown="1">

Yes, you can download the documentation as a [single Markdown file](https://blobs.duckdb.org/docs/ducklake-docs.md) and as a [PDF](https://blobs.duckdb.org/docs/ducklake-docs.pdf).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### When is the next version of the DuckLake standard released and what features will it include?

<div class="answer" markdown="1">

The DuckLake 0.4 standard will be released in late 2025.
See the [roadmap]({% link roadmap.md %}) for upcoming features.
For past releases, see the [release calendar]({% link release_calendar.md %}).

</div>

</div>
