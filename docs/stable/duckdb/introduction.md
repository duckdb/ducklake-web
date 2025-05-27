---
layout: docu
title: Introduction
---

In DuckDB, DuckLake is supported through the [`ducklake` extension](https://duckdb.org/docs/stable/core_extensions/ducklake).

## Installation

Install the latest stable [DuckDB](https://duckdb.org/docs/installation/).
(The `ducklake` extensions requires DuckDB v1.3.0 "Ossivalis" or later.)

```sql
INSTALL ducklake;
```

## Configuration

To use DuckLake, you need to make two decisions: Which [metadata catalog database you want to use]({% link docs/stable/duckdb/getting_started/choosing_a_catalog_database.md %}) and [where you want to store those files]({% link docs/stable/duckdb/getting_started/choosing_storage.md %}). In the simplest case, you use a local DuckDB file for the metadata catalog and a local folder on your computer for file storage. 


## Creating a new Database



## Attaching to a Database

