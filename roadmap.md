---
layout: default
title: Development Roadmap
body_class: roadmap blog_typography post
max_page_width: small
toc: false
---

<div class="wrap pagetitle">
  <h1>Development Roadmap</h1>
</div>

## Overview

_(Last Updated: October 2026)_

The DuckLake project is governed by the [non-profit DuckDB Foundation](https://duckdb.foundation/).
The Foundation and [DuckLabs](https://ducklabs.com/) are not funded by external investors (e.g., venture capital).
Instead, the Foundation is funded by contributions from its members, while DuckLabs' revenue is based on commercial support and feature prioritization services.
These extend to the [`ducklake` DuckDB extension]({% link docs/stable/duckdb/introduction.md %}).

## Planned Features

This section lists the features that we plan to work on for the next major DuckLake release.
The list was compiled by the DuckLake maintainers and is based on the long-term vision for the project and the feature requests we received from the community in [GitHub Discussions](https://github.com/duckdb/ducklake/discussions).

### Top Priority

These features are our main focus for the next major release.

* **Branching and Clones.** Git-style branches and merges, snapshot tags and zero-copy table clones.
* **Protected Snapshots and Snapshot Management.** Protecting snapshots from expiration, expiring snapshots per table, expiring the latest snapshot, rolling back to an earlier snapshot, `UNDROP TABLE` and rewriting history to permanently remove data (e.g., for GDPR requests).
* **REST API.** A REST API for DuckLake.
* **Roles and Access Control.** Roles and grants, row-level and column-level security, credential vending and a mode that allows changing data but not schemas.

### If Time Permits

We would like to include these features in the next major release, but some of them may move to a later release.

* **PostgreSQL Catalogs at Scale.** An index on the file column statistics and sharing connections across attached catalogs.
* **More Robust MySQL Catalogs.** Addressing the [known issues]({% link docs/stable/duckdb/usage/choosing_a_catalog_database.md %}#mysql) of using MySQL as a catalog database.
* **Iceberg and Delta Lake Interoperability.** Exporting Iceberg metadata, importing Delta Lake tables and updating `iceberg_to_ducklake` for compatibility with current catalog versions.
* **Pluggable Catalogs.** Moving the catalog code specific to PostgreSQL, SQLite and MySQL into their respective extensions and making these three catalog databases fully pluggable.
* **Bloom Filters, Indexes and Smarter Pruning.** Equality indexes, pruning on `rowid`, statistics on JSON keys and recording the offsets of column chunks. We also plan to collect more statistics, such as an upper bound on the number of distinct values, which helps with parallelizing aggregations.
* **More Control over Compaction.** Filtering by path and partition, repartitioning existing files, a built-in tiered compaction policy and finer control over splitting large files.
* **Fine-Grained Concurrency.** Extending conflict detection below the table level, retrying concurrent deletes from the same file and recording deletions using persistent row IDs instead of positions within files.
* **Partitioning.** Exposing partition information to the optimizer, `INSERT OVERWRITE`, dropping partitions with metadata-only operations and improving how queries read partition values from the catalog.
* **Specification Clarifications.** Metadata for views, rules for when inlined data tables exist, the values of `changes_made` and the schema of delete files.

Please note that there are **no guarantees** that a particular feature will be released within the next release. Everything on this page is subject to change without notice.

## Future Work

These are some of the items that we plan to support in the future. If you are interested in prioritizing some of this work, [get in touch with DuckLabs](https://ducklabs.com/contact/).

* User-defined types.
* Materialized views and incremental maintenance.
* Allow `PRIMARY KEY` syntax without enforcing it, similar to what other OLAP engines do (e.g., [BigQuery](https://cloud.google.com/bigquery/docs/primary-foreign-keys)).
* Fixed-size arrays.
