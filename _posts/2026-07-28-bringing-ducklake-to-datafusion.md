---
layout: post
title: "Bringing DuckLake to DataFusion"
author: "Divya Ranganathan, Eddie Tejeda (Hotdata), Nantia Makrynioti (DuckLabs)"
#thumb: "/images/blog/thumbs/frozen-ducklake.svg"
#image: "/images/blog/thumbs/frozen-ducklake.png"
excerpt: "We implemented DuckLake for Apache DataFusion, supporting multiple databases as catalog backends. The integration gives DataFusion a lakehouse format that manages snapshots and catalog metadata for Parquet files stored in object storage. Our implementation is running in production, and we have open-sourced and donated it to the Apache DataFusion Contrib repository: [https://github.com/datafusion-contrib/datafusion-ducklake](https://github.com/datafusion-contrib/datafusion-ducklake)."
---

At [Hotdata](https://www.hotdata.dev/), we're building infrastructure that lets every AI agent spin up its own isolated database in milliseconds while querying data across structured and unstructured data sources.

We chose Apache DataFusion for query execution, but we also needed a lakehouse format that could efficiently handle metadata, snapshots, and inexpensive database creation without tying us to a particular engine. DuckLake turned out to be a natural fit.

This post covers why we adopted DuckLake, how we added support for it in DataFusion, how it integrates into Hotdata's architecture, and what we observed when benchmarking DuckLake-managed tables against direct Parquet access.

![][image1]

![][image2]

## 

## **What Is Apache DataFusion?**

Apache DataFusion is a query engine written in Rust that uses Apache Arrow as its in-memory format. It provides SQL and DataFrame APIs together with query planning, optimization, and vectorized execution.

DataFusion is a mature engine that leaves the surrounding architecture largely undefined. It intentionally does not prescribe how tables, catalogs, snapshots, or metadata should be managed, allowing it to support multiple storage systems and table formats.

## **What Is DuckLake?**

DuckLake is a lakehouse specification that stores table metadata in a transactional database while using Parquet files for the data . Unlike lakehouse formats that manage metadata as files in object storage, DuckLake performs all metadata operations through a relational database.

That architecture avoids traversing chains of metadata files before determining which Parquet files to scan in a query. DuckLake is built by the same team that created DuckDB, but the format itself is engine-agnostic, so we decided to bring it to Apache DataFusion.

## **Why We Chose DuckLake**

Traditional lakehouse deployments are designed around long-lived databases and tables. Our workload looks very different.

We create and manage databases on demand for AI agents and applications. A database can be created, loaded with data, forked, queried, and deleted in rapid succession. Instead of sharing a single long-lived database, agents work with isolated databases tailored to a specific task or workflow.

This changes the role of the catalog. Rather than managing long-lived tables, the catalog must efficiently represent millions of ephemeral databases and their metadata. 

We considered building our own metadata layer and also evaluated Apache Iceberg. Ultimately, we chose DuckLake because its relational metadata catalog was easy to understand and implement. Metadata lookups are resolved through a relational database rather than requiring multiple object-store requests, which is especially important for the small, latency-sensitive queries that we serve.

The DuckLake specification was also easy to extend. For example, we recently [added support for logical catalogs](https://github.com/datafusion-contrib/datafusion-ducklake#multi-catalog-postgresql-experimental). A single metadata store can host multiple independent DuckLake catalogs with catalog specific snapshots and schemas. This is useful for multi-tenant deployments or keeping many logical lakehouses in one database.This allows us to provision millions of isolated databases without duplicating metadata infrastructure or underlying Parquet files. 

This implementation now runs in production at Hotdata, and we've contributed it back to the Apache DataFusion Contrib repository. We've also been excited to see growing community interest, with multiple companies now contributing to the project.

## **Measuring Metadata Overhead**

Since we rely on it in production, we’re continuously measuring performance and guarding against regressions as the implementation evolves. 

To give a sense of how much overhead DuckLake adds to our queries, we decided to compare DuckLake-backed tables against direct Parquet access using identical TPC-H datasets. The benchmark included all 22 TPC-H queries across three dataset sizes.

![][image3]

DuckLake’s metadata layer did not introduce a measurable performance penalty.

In our benchmarks, DuckLake-backed tables performed slightly better than direct Parquet access. Both approaches ultimately use DataFusion’s Parquet reader, so the difference is due to lower planning overhead. DuckLake already knows the exact files that belong to a snapshot, avoiding some of the metadata discovery required when constructing a generic Parquet table.

Given that DuckLake’s metadata layer introduced no measurable overhead compared to direct Parquet access in our benchmarks, gaining snapshots, schema evolution, and catalog metadata made the decision straightforward.

## **Summary**

Implementing DuckLake for Apache DataFusion gave us the table and catalog model we were looking for without having to build it ourselves, while letting DataFusion do what it does best: execute queries.

Just as importantly, our benchmarks showed that adding snapshots and catalog metadata didn’t introduce measurable overhead compared with querying Parquet directly under the conditions we tested. That gave us confidence we could adopt a richer table format without sacrificing performance. We’ll continue using and improving the implementation alongside the broader DuckLake community as the project moves toward a 1.0 release. Contributions are welcome\!
