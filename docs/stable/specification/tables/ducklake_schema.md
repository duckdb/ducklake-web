---
layout: docu
title: ducklake_schema
---

This table defines valid schemas.

| Column name      | Column type |             |
| ---------------- | ----------- | ----------- |
| `schema_id`      | `BIGINT`    | Primary Key |
| `schema_uuid`    | `UUID`      |             |
| `begin_snapshot` | `BIGINT`    |             |
| `end_snapshot`   | `BIGINT`    |             |
| `schema_name`    | `VARCHAR`   |             |


- `schema_id` is the numeric identifier of the schema. `schema_id` is incremented from `next_catalog_id` in the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}).
- `schema_uuid` is a UUID that gives a persistent identifier for this schema. The UUID is stored here for compatibility with existing Lakehouse formats.
- `begin_snapshot` refers to a `snapshot_id` from the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}). The schema exists *starting with* this snapshot id.
- `end_snapshot` refers to a `snapshot_id` from the [`ducklake_snapshot` table]({% link docs/stable/specification/tables/ducklake_snapshot.md %}). The schema exists *until* this snapshot id. If `end_snapshot` is `NULL`, the schema is currently valid. 
- `schema_name` is the name of the schema, e.g. `my_schema`.



