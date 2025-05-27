---
layout: docu
title: ducklake_metadata
---

The `ducklake_metadata` table contains key/value pairs with information about the specific setup of the DuckLake catalog.

| Column name | Column type |             |
| ----------- | ----------- | ----------- |
| `key`       | `VARCHAR`   | Not `NULL`  |
| `value`     | `VARCHAR`   | Not `NULL`  |

- `key` is an arbitrary key string. See below for a list of pre-defined keys. The key can't be `NULL`.
- `value` is the arbitrary value string.

Currently, the following keys are specified:

* `version`: The DuckLake schema version, currently `0.1`.
* `created_by`: A string that identifies which program wrote the schema, e.g., `DuckDB v1.3.0`
* `data_path`: The data path prefix for reading and writing data files, e.g., `s3://mybucket/myprefix/`. This always ends in a `/`.
* `encryption`: A boolean (`true` or `false`) that speficies whether data files are encrypted or not.
