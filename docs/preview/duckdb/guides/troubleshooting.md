---
layout: docu
title: Troubleshooting
---

This guide explains how to troubleshoot certain issues with DuckLake.
Besides the issues described on this page, see also the [“Unsupported Features” page]({% link docs/preview/duckdb/unsupported_features.md %}).

## Connecting to an Older DuckLake

If you try to connect to a DuckLake created by an older version of the `ducklake` extension, you get the following error message:

```console
Invalid Input Error:
DuckLake catalog version mismatch: catalog version is 0.3, but the extension requires version 0.4-dev1.
To automatically migrate, set AUTOMATIC_MIGRATION to TRUE when attaching.
```

To work around this, add the `AUTOMATIC_MIGRATION` flag to the `ATTACH` command:

```sql
ATTACH '...' (AUTOMATIC_MIGRATION);
```

## Connecting to a Read-Only DuckLake

If you try to connect to a read-only DuckLake, you get the following error message:

```console
Invalid Input Error:
Failed to migrate DuckLake from v0.2 to v0.3:
Cannot execute statement of type "CREATE" on database "__ducklake_metadata_sf1" which is attached in read-only mode!
```

It is not possible to connect to a read-only DuckLake with a pre-release version (v0.x).
To migrate from such a DuckLake, use an older version of the `ducklake` extension and migrate into an intermediate format.
For example, copy the data into a DuckLake that you have write access to, then connect to that DuckLake using the newer `ducklake` extension.
