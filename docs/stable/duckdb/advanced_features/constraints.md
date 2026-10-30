---
layout: docu
title: Constraints
---

DuckLake has limited support for constraints.
The only constraint type that is currently supported is `NOT NULL`.
It does not support `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, or `CHECK` constraints.

## Examples

Define a column as not accepting `NULL` values using the `NOT NULL` constraint.

```sql
CREATE TABLE tbl (col INTEGER NOT NULL);
```

Add a `NOT NULL` constraint to an existing column of an existing table.

```sql
ALTER TABLE tbl ALTER col SET NOT NULL;
```

A constraint can be added even when column statistics are unavailable.
Existing rows are checked for `NULL` values.
Setting a constraint that is already present is a no-op.

Drop a `NOT NULL` constraint from a table.

```sql
ALTER TABLE tbl ALTER col DROP NOT NULL;
```

Dropping a constraint that is not present is a no-op.
