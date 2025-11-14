---
layout: docu
title: Comments
---

Comments can be added to tables, views and columns using the [`COMMENT ON`](https://duckdb.org/docs/stable/sql/statements/comment_on) syntax.
The comments are stored in the metadata, and can be modified in a transactional manner:
- For tables and views, comments are in the [`ducklake_tag`]({% link docs/stable/specification/tables/ducklake_tag.md %}) table.
- For columns, comments are in the [`ducklake_column_tag`]({% link docs/stable/specification/tables/ducklake_column_tag.md %}) table.

## Examples

Create a comment on a `TABLE`:

```sql
COMMENT ON TABLE test_table IS 'very nice table';
```

Create a comment on a `COLUMN`:

```sql
COMMENT ON COLUMN test_table.test_table_column IS 'very nice column';
```
