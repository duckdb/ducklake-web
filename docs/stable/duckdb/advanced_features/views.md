---
layout: docu
title: Views
---

Views can be created using the standard [`CREATE VIEW` syntax](https://duckdb.org/docs/stable/sql/statements/create_view.html).
The views are stored in the metadata, in the [`ducklake_view`](../../specification/tables/ducklake_view) table.

### Examples

Create a view.

```sql
CREATE VIEW v1 AS SELECT * FROM tbl;
```
