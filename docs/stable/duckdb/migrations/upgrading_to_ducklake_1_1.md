---
layout: docu
title: Upgrading to DuckLake 1.1
---

DuckLake 1.1 can read and write version 1.0 catalogs without migrating them.
Upgrading the extension does not automatically change an existing 1.0 catalog.

## Migrating a Catalog

Before migrating, [back up the catalog and its data files]({% link docs/stable/duckdb/guides/backups_and_recovery.md %}) and ensure all clients support DuckLake 1.1.
Attach the catalog with `AUTOMATIC_MIGRATION` enabled:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake (AUTOMATIC_MIGRATION true);
```

This requires write access to the metadata database, including permission to alter its tables.
For PostgreSQL, use the owner of the metadata tables.
We can check the resulting version with:

```sql
SELECT value FROM my_ducklake.options() WHERE option_name = 'version';
```

The result is `1.1`.
If `ducklake_default_version` is set to `1.0`, `AUTOMATIC_MIGRATION` keeps the catalog at version 1.0, so run `RESET ducklake_default_version;` before migrating.
Subsequent attachments can omit `AUTOMATIC_MIGRATION`. A migrated catalog cannot be downgraded.

## Keeping a Catalog at Version 1.0

Attach an existing 1.0 catalog without requesting migration to keep its version.
To create a new catalog at version 1.0, specify:

```sql
ATTACH 'ducklake:compatible.ducklake' AS my_ducklake (DUCKLAKE_VERSION '1.0');
```

Otherwise, new catalogs use version 1.1.
The global `ducklake_default_version` setting supplies the requested version when `DUCKLAKE_VERSION` is omitted, including when attaching existing catalogs.
Use `RESET ducklake_default_version;` to clear it.
Requesting version 1.1 for an existing 1.0 catalog also requires `AUTOMATIC_MIGRATION true`.

Features such as [nested schemas]({% link docs/stable/duckdb/advanced_features/nested_schemas.md %}) and the `"NULL"` type require DuckLake format version 1.1.

> Pinning the catalog format does not pin the DuckDB metadata file's storage version. DuckLake opens a DuckDB metadata file with the latest storage version of the running DuckDB, so any write from a newer DuckDB release can make the file unreadable by older DuckDB clients. Use the same DuckDB release for every client that opens the file, or use a PostgreSQL or SQLite catalog.

## Migration Errors

Catalogs from before 1.0 and catalogs labeled `1.1-dev1` require migration even for read-only use.
`DUCKLAKE_VERSION '1.1-dev1'` is not accepted.
Migrate through a writable attachment first.
See [Troubleshooting]({% link docs/stable/duckdb/guides/troubleshooting.md %}) for version-mismatch errors.

Version 1.1 reserves column names beginning with `_ducklake_`.
If migration reports a collision with an inlined table's system columns, attach the 1.0 catalog without migration, rename the user column, and run `CALL ducklake_flush_inlined_data('my_ducklake');` before detaching and retrying migration.
