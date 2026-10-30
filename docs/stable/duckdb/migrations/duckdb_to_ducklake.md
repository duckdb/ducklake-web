---
layout: docu
title: DuckDB to DuckLake
---

Migrating from DuckDB to DuckLake is very simple to do with the DuckDB `ducklake` extension. However, if you are currently using some DuckDB features that are [unsupported in DuckLake]({% link docs/stable/duckdb/unsupported_features.md %}), this guide will definitely help you.

## First Scenario: Everything Is Supported

If you are not using any of the unsupported features, migrating from DuckDB to DuckLake will be as simple as running the following commands:

```sql
ATTACH 'ducklake:my_ducklake.ducklake' AS my_ducklake;
ATTACH 'db.duckdb' AS my_duckdb;

COPY FROM DATABASE my_duckdb TO my_ducklake;
```

Note that it doesn't matter what catalog you are using as a metadata backend for DuckLake.

## Second Scenario: Not Everything Is Supported

If you have been using DuckDB for a while, there is a chance you are using some very specific types or even things like generated columns. If this is your case, then migrating will have some tradeoffs.

- Specific types need to be cast to a [supported DuckLake type]({% link docs/stable/specification/data_types.md %}). User defined types that are created as a `STRUCT` can be interpreted as such and `ENUM` and `UNION` will be cast to `VARCHAR` and `VARINT` will be cast to `VARCHAR` to preserve values outside the range of fixed-size integers.

- Macros can be migrated to the DuckLake catalog with any supported metadata backend, including PostgreSQL, SQLite, and MySQL.

- Generated columns are not supported, so their computed values are copied into regular columns. This means that the values will always be persisted (no `VIRTUAL` option).

Expression defaults, such as `DEFAULT now()`, are supported in `CREATE TABLE` and `ALTER TABLE ... SET DEFAULT`.
`ALTER TABLE ... ADD COLUMN` only accepts literal defaults.

### Migration Script

The following Python script can be used to migrate from a DuckDB persisted database to DuckLake bypassing the unsupported features.

The script copies table data using `CREATE TABLE AS`, which does not preserve constraints, defaults, or generated-column definitions.
Recreate macro parameter defaults and overloads manually, and update catalog-qualified references in macros and views to point to the destination.

> Currently, only local migrations are supported by this script. The script will be adapted in the future to account for migrations to remote object storage such as S3 or GCS.

<!-- markdownlint-disable MD040 MD046 -->

<details markdown='1'>
<summary markdown='span'>
<span style="text-decoration: underline">Click to see the Python script that migrates from DuckDB to DuckLake.</span>
</summary>
```python
import duckdb
import argparse
import re
import os
from collections import deque

TYPE_MAPPING = {
    "VARINT": "::VARCHAR",
    "BIGNUM": "::VARCHAR",
    "UNION/ENUM": "::VARCHAR",
    "BIT": "::VARCHAR",
}


def get_postgres_secret():
    return f"""
        CREATE SECRET postgres_secret(
            TYPE postgres,
            HOST '{os.getenv("POSTGRES_HOST", "localhost")}',
            PORT {os.getenv("POSTGRES_PORT", "5432")},
            DATABASE {os.getenv("POSTGRES_DB", "migration_test")},
            USER '{os.getenv("POSTGRES_USER", "user")}',
            PASSWORD '{os.getenv("POSTGRES_PASSWORD", "simple")}'
        );"""


def _resolve_data_types(
    table: str, schema: str, catalog: str, conn: duckdb.DuckDBPyConnection
):
    excepts = []
    casts = []
    for col in conn.execute(
        f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}' AND table_schema = '{schema}' AND table_catalog = '{catalog}'"
    ).fetchall():
        col_name, col_type = col[0], col[1]
        # Handle mapped types
        if col_type in TYPE_MAPPING or re.match(r"(ENUM|UNION)\b", col_type):
            cast = TYPE_MAPPING.get(col_type) or TYPE_MAPPING["UNION/ENUM"]
            casts.append(f"{col_name}{cast} AS {col_name}")
            excepts.append(col_name)
        # Handle array types
        elif re.fullmatch(r"(INTEGER|VARCHAR|FLOAT)\[\d+\]", col_type):
            base_type = re.match(r"(INTEGER|VARCHAR|FLOAT)", col_type).group(1)
            cast = f"::{base_type}[]"
            casts.append(f"{col_name}{cast} AS {col_name}")
            excepts.append(col_name)
    return excepts, casts


def migrate_tables_and_views(duckdb_catalog: str, con: duckdb.DuckDBPyConnection):
    """
    Migrate tables and views from the DuckDB catalog to DuckLake using a queue system.
    If migration of a table or view fails, it will be re-added to the back of the queue.
    """
    rows = con.execute(
        f"SELECT table_catalog, table_schema, table_name, table_type "
        f"FROM information_schema.tables WHERE table_catalog = '{duckdb_catalog}'"
    ).fetchall()

    # The idea behind this queue is to retry failed migration of views due to missing dependencies.
    # The failed item is re-added to the back of the queue and waits for the rest of the dependencies to be migrated.
    # This avoids the need to generate a full dependency graph, which would make this script very complex.
    queue = deque(rows)
    failed_last_round = set()

    while queue:
        catalog, schema, table, table_type = queue.popleft()
        con.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
        try:
            if table_type == "VIEW":
                view_definition = con.execute(
                    f"SELECT view_definition FROM information_schema.views "
                    f"WHERE table_name = '{table}' AND table_schema = '{schema}' AND table_catalog = '{catalog}'"
                ).fetchone()[0]
                con.execute(
                    f"CREATE VIEW IF NOT EXISTS {view_definition.removeprefix('CREATE VIEW ')}"
                )
                print(f"Migrating Catalog: {catalog}, Schema: {schema}, View: {table}")
            else:
                excepts, casts = _resolve_data_types(table, schema, catalog, con)
                if casts:
                    select_clause = (
                        "* EXCLUDE(" + ", ".join(excepts) + "),\n" + ",\n".join(casts)
                    )
                    con.execute(
                        f"CREATE TABLE IF NOT EXISTS {schema}.{table} AS "
                        f"SELECT {select_clause} FROM {catalog}.{schema}.{table}"
                    )
                else:
                    con.execute(
                        f"CREATE TABLE IF NOT EXISTS {schema}.{table} AS "
                        f"SELECT * FROM {catalog}.{schema}.{table}"
                    )
                print(f"Migrating Catalog: {catalog}, Schema: {schema}, Table: {table}")
        except Exception as e:
            print(f"WARNING: Requeuing {table_type} {table}")
            # Prevent infinite loop if no progress is possible
            if (catalog, schema, table, table_type) in failed_last_round:
                print(
                    f"Skipping {table_type} {table} permanently due to repeated failure. {e}"
                )
                continue
            else:
                queue.append((catalog, schema, table, table_type))
                failed_last_round.add((catalog, schema, table, table_type))
        else:
            # Success — ensure we clear from failure set
            failed_last_round.discard((catalog, schema, table, table_type))


def migrate_macros(
    con: duckdb.DuckDBPyConnection, duckdb_catalog: str, final: bool = True
):
    """
    Migrate macros from the DuckDB catalog to the attached DuckLake catalog.
    Macros that reference a table or macro that does not exist yet are retried.
    """
    def quote_identifier(name):
        return '"' + name.replace('"', '""') + '"'

    pending = con.execute(
        "SELECT schema_name, function_name, parameters, parameter_types, "
        "macro_definition, function_type FROM duckdb_functions() "
        "WHERE database_name = ? AND function_type IN ('macro', 'table_macro')",
        [duckdb_catalog],
    ).fetchall()
    while pending:
        failed = []
        for row in pending:
            schema, name, parameters, parameter_types, definition, function_type = row
            con.execute(f"CREATE SCHEMA IF NOT EXISTS {quote_identifier(schema)}")
            arguments = ','.join(
                quote_identifier(parameter) + (f" {parameter_type}" if parameter_type else '')
                for parameter, parameter_type in zip(parameters, parameter_types)
            )
            table_keyword = 'TABLE ' if function_type == 'table_macro' else ''
            try:
                con.execute(
                    f"CREATE OR REPLACE MACRO {quote_identifier(schema)}.{quote_identifier(name)}"
                    f"({arguments}) AS {table_keyword}{definition}"
                )
                print(f"Migrating Macro: {schema}.{name}")
            except duckdb.Error as e:
                failed.append((row, e))
        if len(failed) == len(pending):
            if final:
                for row, e in failed:
                    print(f"Skipping Macro {row[0]}.{row[1]} due to repeated failure. {e}")
            break
        pending = [row for row, _ in failed]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate DuckDB catalog to DuckLake.")
    parser.add_argument("--duckdb-catalog", required=True, help="DuckDB catalog name")
    parser.add_argument("--duckdb-file", required=True, help="Path to DuckDB file")
    parser.add_argument(
        "--ducklake-catalog", required=True, help="DuckLake catalog name"
    )
    parser.add_argument(
        "--catalog-type",
        choices=["duckdb", "postgresql", "sqlite"],
        required=True,
        help="Choose one of: duckdb, postgresql, sqlite",
    )
    parser.add_argument("--ducklake-file", required=False, help="Path to DuckLake file")
    parser.add_argument(
        "--ducklake-data-path", required=True, help="Data path for DuckLake"
    )

    args = parser.parse_args()

    con = duckdb.connect()

    if args.catalog_type == "postgresql":
        con.execute(get_postgres_secret())

    secret = (
        "CREATE SECRET ducklake_secret (TYPE ducklake"
        + (
            f"\n,METADATA_PATH '{args.ducklake_file if args.catalog_type == 'duckdb' else f'sqlite:{args.ducklake_file}'}'"
            if args.catalog_type in ("duckdb", "sqlite")
            else "\n,METADATA_PATH ''"
        )
        + f"\n,DATA_PATH '{args.ducklake_data_path}'"
        + (
            "\n,METADATA_PARAMETERS MAP {'TYPE': 'postgres', 'SECRET': 'postgres_secret'});"
            if args.catalog_type == "postgresql"
            else ");"
        )
    )
    con.execute(secret)

    con.execute(
        f"ATTACH '{args.duckdb_file}' AS {args.duckdb_catalog};"
        f"ATTACH 'ducklake:ducklake_secret' AS {args.ducklake_catalog}; USE {args.ducklake_catalog};"
    )

    # Migrate macros before views that use them, and again after the tables they reference
    migrate_macros(
        con=con,
        duckdb_catalog=args.duckdb_catalog,
        final=False,
    )
    migrate_tables_and_views(
        duckdb_catalog=args.duckdb_catalog,
        con=con,
    )
    migrate_macros(
        con=con,
        duckdb_catalog=args.duckdb_catalog,
    )
    migrate_tables_and_views(
        duckdb_catalog=args.duckdb_catalog,
        con=con,
    )
    con.close()
```
</details>

<!-- markdownlint-enable MD040 MD046 -->

The script can be run in any Python environment with DuckDB installed. The usage is the following:

```text
usage: migration.py [-h]
    --duckdb-catalog DUCKDB_CATALOG
    --duckdb-file DUCKDB_FILE
    --ducklake-catalog DUCKLAKE_CATALOG
    --catalog-type {duckdb,postgresql,sqlite}
    [--ducklake-file DUCKLAKE_FILE]
    --ducklake-data-path DUCKLAKE_DATA_PATH
```

If you are migrating to PostgreSQL, make sure that you provide the following environment variables for the PostgreSQL secret connection:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
