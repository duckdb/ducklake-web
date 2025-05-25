---
layout: default
title: Frequently Asked Questions
body_class: faq
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

DuckLake provides a lightweight one-stop solution for if you need a data lake and catalog.

You can use DuckLake for a “multiplayer DuckDB” setup with multiple DuckDB instance reading and writing the same dataset –
a concurrency model [not supported by vanilla DuckDB](https://duckdb.org/docs/stable/connect/concurrency).

If you only use DuckDB for both your DuckLake entry point and your catalog database, you can still benefit from using DuckLake:
you can run [time travel queries](TODO),
exploit [data partitioning](TODO),
and can store your data in multiple files instead of using a single (potentially very large) database file.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Is DuckLake an open table format?

<div class="answer" markdown="1">

DuckLake _includes_ an _open table format_ but it's also a _data lakehouse_ format, meaning that it also contains a catalog to encode the schema of the data stored.
When comparing to other technologies, DuckLake is similar to Delta Lake with Unity Catalog and Iceberg with Lakekeeper or Polaris.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is “DuckLake”?

<div class="answer" markdown="1">

First of all, a pun with a DuckDB-originated technology for data lakes and lakehouses.
More seriously, the term “DuckLake” can refer to three things:

1. the _specification_ of the DuckLake lakehouse format,
2. the [`ducklake` _DuckDB extension_](https://duckdb.org/docs/stable/core_extensions/ducklake), which supports reading/writing datasets in the DuckLake specification,
3. a DuckLake, a _dataset_ stored using the DuckLake lakehouse format.

</div>

</div>





## Architecture




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What are the main components of DuckLake?

<div class="answer" markdown="1">

The DuckLake needs a storage layer (both blob storage and block-based storage works) and a catalog database (any SQL-compatible database works).

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

While we tested DuckLake extensively, it is not yet production-ready as demonstrated by its version number {{ page.currentshortducklakeversion }}.
We expect DuckLake to mature over the course of 2025.

</div>

</div>





<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How is authentication implemented in DuckLake?

<div class="answer" markdown="1">

TODO

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How does DuckLake deal with the “small files problem”?

<div class="answer" markdown="1">

The “small files problem” is a well-known problem in data lake formats and occurs e.g. when data is inserted in small batches, yielding many small files with each storing only a small amount of data.
DuckLake significantly mitigates this problem by storing the metadata in a database system (catalog database) and making the compaction step simple.
DuckLake also harnesses the catalog database to stage data before serializing it into Parquet files.
Further improvements are on the roadmap.

</div>

</div>









## Features




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are constraints such as primary keys and foreign keys supported?

<div class="answer" markdown="1">

No. Similarly to other data lakehouse technologies, DuckLake does not support constraints, keys, or indexes.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Can I export my DuckLake into other lakehouse formats?

<div class="answer" markdown="1">

This is currently not supported.
You can export DuckLake into a DuckDB database and export it into e.g. vanilla Parquet files.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are DuckDB database files supported as the _data files_ for DuckLake?

<div class="answer" markdown="1">

The data files of DuckLake must be stored in Parquet.
DuckDB files as storage are not supported at the moment.

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

DuckLake is tested using a subset of [DuckDB's extensive test suite](https://duckdb.org/why_duckdb#thoroughly-tested).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How can I contribute to DuckLake?

<div class="answer" markdown="1">

If encounter any problem using DuckLake, please submit an issue in the [DuckLake issue tracker](https://github.com/duckdb/ducklake/issues).
If you have any suggestions or feature requests, please open a ticket in [DuckLake's discussion forum](https://github.com/duckdb/ducklake/discussions).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is the license of DuckLake?

<div class="answer" markdown="1">

The DuckLake specification and the DuckLake DuckDB extension are released under the MIT license.

</div>

</div>

