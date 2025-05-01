---
layout: docu
title: Frequently Asked Questions
---

<!-- ################################################################################# -->
<!-- ################################################################################# -->
<!-- ################################################################################# -->

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

### Is DuckLake a direct competitor to the Delta Lake storage framework or the Iceberg open table format?

<div class="answer" markdown="1">

No, it's a data lakehouse format, so it competes against Delta with Unity Catalog, Iceberg with Lakekeeper or Polaris, etc.

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

### Does DuckLake solve the “small files problem”?

<div class="answer" markdown="1">

DuckLake mitigates this problem but does not yet fully solve it. It's on the roadmap.

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

No. The data files must be stored in Parquet.

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
