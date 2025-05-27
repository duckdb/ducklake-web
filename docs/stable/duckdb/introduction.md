---
layout: docu
title: Introduction
redirect_from:
- /docs/stable/duckdb
- /docs/stable/duckdb/
---

In DuckDB, DuckLake is supported through the [`ducklake` extension](https://duckdb.org/docs/stable/core_extensions/ducklake).

## Installation

Install the latest stable [DuckDB](https://duckdb.org/docs/installation/).
(The `ducklake` extensions requires DuckDB v1.3.0+.)

```sql
INSTALL ducklake;
```

## Using DuckLake

### Attaching to a DuckLake

To attach to a DuckLake, use the [`ATTACH` statement](https://duckdb.org/docs/stable/sql/statements/attach#attach).

```sql
ATTACH 'ducklake:metadata.ducklake' AS my_ducklake (DATA_PATH 'data_files');
USE my_ducklake;
```

### Detachinf from a DuckLake

To detach from a DuckLake, make sure that your DuckLake is not your default database, then use the [`DETACH` statement](https://duckdb.org/docs/stable/sql/statements/attach#detach):

```sql
USE memory;
DETACH my_ducklake;
```
