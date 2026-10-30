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

## Planned Features for DuckLake 2.0

This section lists the features that we plan to work on for DuckLake 2.0.
The list was compiled by the DuckLake maintainers and is based on the long-term vision for the project and the feature requests we received from the community in [GitHub Discussions](https://github.com/duckdb/ducklake/discussions).

### Top Priority

These features are our main focus for DuckLake 2.0.

* Branching and clones.
* Protected snapshots and snapshot management.
* REST API.
* Roles and access control.

### If Time Permits

We would like to include these features in DuckLake 2.0, but some of them may move to a later release.

* PostgreSQL catalogs at scale with automatic or suggested index creation.
* [More robust MySQL catalogs]({% link docs/stable/duckdb/usage/choosing_a_catalog_database.md %}#mysql).
* Iceberg and Delta Lake interoperability.
* Pluggable catalogs.
* Bloom filters, indexes, additional statistics and smarter pruning.

Please note that there are **no guarantees** that a particular feature will be released in DuckLake 2.0. Everything on this page is subject to change without notice.

## Future Work

These are some of the items that we plan to support in the future. If you are interested in prioritizing some of this work, [get in touch with DuckLabs](https://ducklabs.com/contact/).

* User-defined types.
* Materialized views and incremental maintenance.
* Allow `PRIMARY KEY` syntax without enforcing it, similar to what other OLAP engines do (e.g., [BigQuery](https://cloud.google.com/bigquery/docs/primary-foreign-keys)).
* Fixed-size arrays.
* PostgreSQL performance improvements: reduce number of roundtrips and explore optimizations for large metadata (e.g., by using stored procedures).
