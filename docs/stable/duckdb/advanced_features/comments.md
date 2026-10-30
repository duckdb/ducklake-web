---
layout: docu
title: Comments
---

Comments can be added to tables, views, and columns using the [`COMMENT ON`](https://duckdb.org/docs/current/sql/statements/comment_on) syntax.
The comments are stored in the metadata, and can be modified in a transactional manner:
- For tables and views, comments are in the [`ducklake_tag`]({% link docs/stable/specification/tables/ducklake_tag.md %}) table.
- For table columns, comments are in the [`ducklake_column_tag`]({% link docs/stable/specification/tables/ducklake_column_tag.md %}) table.
- For view columns, comments are in the [`ducklake_view_column_tag`]({% link docs/stable/specification/tables/ducklake_view_column_tag.md %}) table.

## Examples

Create a comment on a `TABLE`:

```sql
COMMENT ON TABLE test_table IS 'very nice table';
```

Create a comment on a `COLUMN`:

```sql
COMMENT ON COLUMN test_table.test_table_column IS 'very nice column';
```

Create a comment on a view column:

```sql
CREATE VIEW test_view (view_column) AS
    SELECT test_table_column FROM test_table;
COMMENT ON COLUMN test_view.view_column IS 'very nice view column';
```

View column comments use the view's output column names and require DuckLake format version 1.1.
