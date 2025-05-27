---
layout: docu
title: Encryption
---

DuckLake supports an encrypted mode.
In this mode, all files that are written to the data directory are encrypted using [Parquet encryption](https://parquet.apache.org/docs/file-format/data-pages/encryption/).
In order to use this mode, the `ENCRYPTED` flag must be passed when initializing the DuckLake catalog:

```sql
ATTACH 'ducklake:encrypted.ducklake' (DATA_PATH 'untrusted_location/', ENCRYPTED);
``` 
