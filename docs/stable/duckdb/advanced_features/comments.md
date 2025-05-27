---
layout: docu
title: Comments
---

Comments can be added to tables, views and columns using the [`COMMENT ON`](https://duckdb.org/docs/stable/sql/statements/comment_on) syntax.
The comments are stored in the metadata, and can be modified in a transactional manner.

## Examples

Create a comment on a `TABLE`:

```sql
COMMENT ON TABLE test_table IS 'very nice table';
```

Create a comment on a `COLUMN`:

```sql
COMMENT ON COLUMN test_table.test_table_column IS 'very nice column';
```
