---
layout: docu
title: Backup and Recovery
---

DuckLake has two components: catalog and storage. The catalog contains all of DuckLake's metadata and any inlined data, while the storage contains the data and delete files, including Puffin files when deletion vectors are enabled. The catalog is a [database]({% link docs/stable/duckdb/usage/choosing_a_catalog_database.md %}), while the storage layer can be any [filesystem backend supported by DuckDB]({% link docs/stable/duckdb/usage/choosing_storage.md %}). These two components have different backup strategies, so this document will address them separately.

> In this document, we will focus on disasters caused by human errors or application failures/malfunctions that result in data corruption or loss.

## Catalog Backup and Recovery

Backup and recovery strategies depend on the SQL database you are using as a DuckLake catalog.

> Pause writes, [compaction]({% link docs/stable/duckdb/maintenance/merge_adjacent_files.md %}), and [cleanup jobs]({% link docs/stable/duckdb/maintenance/cleanup_of_files.md %}) while making a manual backup. Back up the catalog and all files it references together. Cleanup can otherwise remove files needed by an older catalog backup.

### DuckDB Catalog

For DuckDB, the best approach is to perform regular backups of the metadata database. If the original database is corrupted, tampered with, or even deleted, you can recover from this backup.

```sql
-- Backup
ATTACH 'db.duckdb' AS db (TYPE duckdb, READ_ONLY);
ATTACH 'backup.duckdb' AS backup;
COPY FROM DATABASE db TO backup;
DETACH db;
DETACH backup;

-- Recover into a new, empty database
ATTACH 'restored.duckdb' AS db;
ATTACH 'backup.duckdb' AS backup (TYPE duckdb, READ_ONLY);
COPY FROM DATABASE backup TO db;
DETACH db;
DETACH backup;
ATTACH 'ducklake:restored.duckdb' AS my_ducklake;
```

It is very important to note that transactions committed to DuckLake after the metadata backup will not be tracked when recovering. The data from the transactions may exist in data files or only in the newer catalog's inlined data, but the backup will point to a previous snapshot. If you are running batch jobs, make sure to always back up after the batch job. If you are regularly micro-batching or streaming data, then schedule periodic jobs to back up your metadata.

> Tip To create a backup file with the current timestamp in Python:
>
> ```python
> import duckdb
> import datetime
> con = duckdb.connect(f"backup_{datetime.datetime.now().strftime('%Y-%m-%d__%I_%M_%S')}.duckdb")
> ```

### SQLite Catalog

For SQLite, the process is exactly the same as with DuckDB and has the same implications.

```sql
-- Backup
ATTACH 'sqlite:db.duckdb' AS db (READ_ONLY);
ATTACH 'sqlite:backup.duckdb' AS backup;
COPY FROM DATABASE db TO backup;
DETACH db;
DETACH backup;

-- Recover into a new, empty database
ATTACH 'sqlite:restored.duckdb' AS db;
ATTACH 'sqlite:backup.duckdb' AS backup (READ_ONLY);
COPY FROM DATABASE backup TO db;
DETACH db;
DETACH backup;
ATTACH 'ducklake:sqlite:restored.duckdb' AS my_ducklake;
```

### PostgreSQL Catalog

For PostgreSQL, there are two main approaches to backup and recovery:

- [SQL dump](https://www.postgresql.org/docs/current/backup-dump.html): This approach is similar to the one mentioned for SQLite and DuckDB. This process can happen periodically and can only recover to a particular point in time (i.e., the time of the dump). For DuckLake, this will be a specific snapshot, and transactions after this snapshot will not be recorded.
- [Continuous Archiving and Point-in-Time Recovery (PITR)](https://www.postgresql.org/docs/current/continuous-archiving.html): This is a more complex approach but allows recovery to a specific point in time. For DuckLake, this means you can recover to a snapshot covered by the archived logs, provided its data files are still available.

Use PostgreSQL's `pg_dump` and `pg_restore` utilities to back up the catalog and restore it into a new, empty database.

> Warning `COPY FROM DATABASE` with the [`postgres` extension](https://duckdb.org/docs/current/core_extensions/postgres/overview) fails on a DuckLake catalog because it cannot copy the catalog's primary-key indexes.

```batch
pg_dump --format=custom --file=backup.dump '⟨connection_string⟩'
pg_restore --dbname='⟨restored_connection_string⟩' backup.dump
```

```sql
ATTACH 'ducklake:postgres:⟨restored_connection_string⟩' AS my_ducklake;
```

> Cloud-hosted PostgreSQL solutions may offer different mechanisms. We encourage you to check what your specific vendor recommends as a strategy for backup and recovery.

### Quack Catalog

Stop the Quack server, then back up or restore its DuckDB metadata file using the DuckDB approach above.

## Storage Backup and Recovery

Backup and recovery of the data files also depend on the storage you are using. In this document, we will only focus on cloud-based object storage since it is the most common for lakehouse architectures.

### S3

In S3, there are three main mechanisms that AWS offers to back up and/or restore data:

- [Cross-bucket replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [S3 backup service](https://docs.aws.amazon.com/aws-backup/latest/devguide/s3-backups.html)
- [Enable S3 versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)

Both the S3 backup service and S3 object versioning will restore data files in the same bucket. On the other hand, cross-bucket replication will copy the files to a different bucket, and therefore your DuckLake initialization should change:

```sql
-- Before
ATTACH 'ducklake:some.duckdb' AS my_ducklake (DATA_PATH 's3://⟨og-bucket⟩/');

-- After
DETACH my_ducklake;
ATTACH 'ducklake:some.duckdb' AS my_ducklake (DATA_PATH 's3://⟨replication-bucket⟩/', OVERRIDE_DATA_PATH true);
```

### GCS

GCS has similar mechanisms to back up and/or restore data:

- [Cross-bucket replication](https://cloud.google.com/storage/docs/using-cross-bucket-replication)
- [Backup and DR service](https://cloud.google.com/backup-disaster-recovery/docs/concepts/backup-dr)
- [Object versioning](https://cloud.google.com/storage/docs/object-versioning) with soft deletes enabled

Regarding cross-bucket replication, repointing to the new bucket will be necessary.

```sql
-- Before
ATTACH 'ducklake:some.duckdb' AS my_ducklake (DATA_PATH 'gs://⟨og-bucket⟩/');

-- After
DETACH my_ducklake;
ATTACH 'ducklake:some.duckdb' AS my_ducklake (DATA_PATH 'gs://⟨replication-bucket⟩/', OVERRIDE_DATA_PATH true);
```
