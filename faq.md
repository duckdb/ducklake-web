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

If you only use DuckDB for both your as DuckLake entry point and your catalog database, you can still benefit from using DuckLake:
you can run [time travel queries](TODO),
exploit [partitioning](TODO),
and can store your data in multiple files instead of using a single huge database file.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Is DuckLake an open table format?

<div class="answer" markdown="1">

No, it's a data lakehouse format, so it similar to Delta with Unity Catalog, Iceberg with Lakekeeper or Polaris, etc.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is DuckLake?

<div class="answer" markdown="1">

DuckLake can refer to three things:

1. the _specification_ of the DuckLake lakehouse format,
2. the `ducklake` _DuckDB extension_, which implements the specification,
3. a DuckLake, a _dataset_ stored using the DuckLake lakehouse format.

</div>

</div>





## Architecture




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What are the main components of DuckLake?

<div class="answer" markdown="1">

The DuckLake needs a storage layer (both object storage and block-based storage works) and a catalog database (any SQL-compatible database works).

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Does DuckLake work on AWS S3 (or a compatible storage)?

<div class="answer" markdown="1">

DuckLake can store the _data files_ on AWS S3?
You can run the _catalog database_ anywhere, e.g., in an AWS Aurora database.

</div>

</div>





## DuckLake in Operation




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Is DuckLake production-ready?

<div class="answer" markdown="1">

While we tested DuckLake extensively, it is not yet production-ready as shown by its version number {{ page.currentshortducklakeversion }}.
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

### Does DuckLake solve the “small files problem”?

<div class="answer" markdown="1">

The “small files problem” is a well-known problem in data lake formats.
It implies that data is stored in the form of many files with each file only containins a small amount of data.
DuckLake mitigates this problem by storing the metadata in a database system and making compaction simple but does not yet fully solve it. It's on the roadmap.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is the largest file and table size?

<div class="answer" markdown="1">

TODO

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

This is currently not supported. You can export DuckLake into a DuckDB database.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are DuckDB database files supported as the _data files_ for DuckLake?

<div class="answer" markdown="1">

DuckDB files as stored are not supported at the moment.
The data files must be stored in Parquet.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### Are there any practical limits to the number of snapshots?

<div class="answer" markdown="1">

No. The only limitation is the catalog database's performance but even with a relatively slow catalog database, you can have millions of snapshots.

</div>

</div>





## Development




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How is DuckLake tested?

<div class="answer" markdown="1">

TODO

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### How can I contribute to DuckLake?

<div class="answer" markdown="1">

TODO

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### What is the license of DuckLake?

<div class="answer" markdown="1">

DuckLake is released under the MIT license.

</div>

</div>




<!-- ----- ----- ----- ----- ----- ----- Q&A entry ----- ----- ----- ----- ----- ----- -->

<div class="qa-wrap" markdown="1">

### QQQ

<div class="answer" markdown="1">

AAA

</div>

</div>
