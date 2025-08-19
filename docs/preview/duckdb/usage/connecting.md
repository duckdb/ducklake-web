---
layout: docu
title: Connecting
---

To use DuckLake, you must first either connect to an existing DuckLake, or create a new DuckLake.
The `ATTACH` command can be used to select the DuckLake instance to connect to.
In the `ATTACH` command, you must specify the [catalog database](choosing_a_catalog_database) and the [data storage location](choosing_storage).
When attaching, a new DuckLake is automatically created if none exists in the specified catalog database. 

Note that the data storage location only has to be specified when creating a new DuckLake.
When connecting to an existing DuckLake, the data storage location is loaded from the catalog database.

```sql
ATTACH 'ducklake:{metadata_storage_location}' (DATA_PATH '{data_storage_location}');
```

In addition, DuckLake connection parameters can also be stored in [secrets](https://duckdb.org/docs/stable/configuration/secrets_manager.html).

```sql
ATTACH 'ducklake:{secret_name}';
```

### Examples
```sql
-- connect to ducklake, reading the configuration from the default (unnamed) secret
ATTACH 'ducklake:';
-- connect to ducklake, reading the configuration from the secret named my_secret
ATTACH 'ducklake:my_secret';

-- use a DuckDB database "duckdb_database.ducklake" as the catalog database, the data path defaults to duckdb_database.ducklake.files
ATTACH 'ducklake:duckdb_database.ducklake';
-- use a DuckDB database "duckdb_database.ducklake" as the catalog database, the data path is explicitly specified as the "my_files" directory
ATTACH 'ducklake:duckdb_database.ducklake' (DATA_PATH 'my_files/');
-- use a Postgres database as the catalog database, and S3 as the data path
ATTACH 'ducklake:postgres:dbname=postgres' (DATA_PATH 's3://my-bucket/my-data/');

-- connect to DuckLake in read only mode
ATTACH 'ducklake:postgres:dbname=postgres' (READ_ONLY);
```

### Parameters

The following parameters are supported for `ATTACH`:

|          Name           |                                                Description                                                |                           Default                            |
|-------------------------|-----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| data_path               | The storage location of the data files                                                                    | `{metadata_file}.files` for DuckDB files, required otherwise |
| metadata_schema         | The schema in the catalog server in which to store the DuckLake tables                                    | `main`                                                       |
| metadata_catalog        | The name of the attached catalog database                                                                 | `__ducklake_metadata_{ducklake_name}`                        |
| encrypted               | Whether or not data is stored encrypted                                                                   | false                                                        |
| data_inlining_row_limit | The number of rows for which [data inlining](/docs/stable/duckdb/advanced_features/data_inlining) is used | 0                                                            |
| snapshot_version        | If provided, connect to DuckLake at a specified snapshot id                                               |                                                              |
| snapshot_time           | If provided, connect to DuckLake at a snapshot at a specified point in time                               |                                                              |
| create_if_not_exists    | Creates a new DuckLake if the specified one does not already exist                                        | true                                                         |
| meta_{parameter_name}   | Pass `{parameter_name}` to the catalog server                                                             |                                                              |

In addition, any parameters that are prefixed with `META_` are passed to the catalog used to store the metadata.
The supported parameters depend on the metadata catalog that is used. 
For example, `Postgres` supports the `SECRET` parameter. By using the `META_SECRET` parameter we can pass this parameter to the Postgres instance.

### Secrets

Instead of configuring the connection using `ATTACH`, secrets can be created that contain all required information for setting up a connection.
Secrets support the same list of parameters as `ATTACH`, in addition to the `METADATA_PATH` and `METADATA_PARAMETERS` parameters.

|        Name         |                     Description                      | Default |
|---------------------|------------------------------------------------------|---------|
| metadata_path       | The connection string for connecting to the metadata |         |
| metadata_parameters | Map of parameters to pass to the catalog server      | {}      |

```sql
-- default (unnamed) secret
CREATE SECRET (
	TYPE DUCKLAKE,
	METADATA_PATH 'metadata.db',
	DATA_PATH 'metadata_files/'
);

ATTACH 'ducklake:' AS my_ducklake;

-- named secrets
CREATE SECRET my_secret (
	TYPE DUCKLAKE,
	METADATA_PATH '',
	DATA_PATH 's3://my-s3-bucket/',
	METADATA_PARAMETERS MAP {'TYPE': 'postgres', 'SECRET': 'postgres_secret'}
);
ATTACH 'ducklake:my_secret' AS my_ducklake;
```

In order to persist secrets, the `CREATE PERSISTENT SECRET` syntax can be used.
