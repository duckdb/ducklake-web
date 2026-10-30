---
layout: docu
title: Partitioning
---

DuckLake tables can be partitioned by a user-defined set of partition keys.
When a DuckLake table has partitioning keys defined, any new data written to Parquet is split up into separate data files along the partitioning keys.
During query planning, DuckLake uses file-level zone maps (per-column min/max statistics stored in `ducklake_file_column_stats`) to decide which files to scan.
For order-preserving partition transforms (`identity`, `year`, and the `epoch_*` transforms), partitioned writes naturally produce tight zone maps on the partition column, so file-level pruning effectively narrows scans to the matching partition files.
Equality and `IN` filters on bucketed columns can also prune partition files.

The partitioning keys defined on a table only affect new data written to the table.
Previously written data will be kept partitioned by the keys the table had when that data was written.
This allows the partition layout of a table to evolve over-time as needed.

The partitioning keys for a file are stored in DuckLake.
These keys do not need to be necessarily stored within the files, or in the paths to the files.

## Examples

> By default, unencrypted DuckLake tables use [Hive partitioning](https://duckdb.org/docs/current/data/partitioning/hive_partitioning).
> If you want to avoid this style of partitions, you can opt out globally via `CALL my_ducklake.set_option('hive_file_pattern', false)`, or per schema/table by passing the `schema` or `table_name` argument.

Define partitioning when creating a table:

```sql
CREATE TABLE tbl (part_key INTEGER, user_id BIGINT, ts TIMESTAMP)
    PARTITIONED BY (part_key);
```

Partitioning can also be defined in `CREATE TABLE AS SELECT` and combined with [sorting]({% link docs/stable/duckdb/advanced_features/sorted_tables.md %}):

```sql
CREATE TABLE events_by_day PARTITIONED BY (epoch_day(ts)) SORTED BY (ts) AS
    SELECT * FROM tbl;
```

Set the partitioning keys of a table, such that new data added to the table is partitioned by these keys.

To partition on a column, use:

```sql
ALTER TABLE tbl SET PARTITIONED BY (part_key);
```

You can also partition using functions. For example, to partition based on the year/month of a timestamp, use:

```sql
ALTER TABLE tbl SET PARTITIONED BY (year(ts), month(ts));
```

To distribute rows into a fixed number of buckets using an Iceberg-compatible hash (Murmur3), use the `bucket` transform:

```sql
ALTER TABLE tbl SET PARTITIONED BY (bucket(8, user_id));
```

Bucket partitioning can be combined with other transforms:

```sql
ALTER TABLE tbl SET PARTITIONED BY (bucket(8, user_id), month(ts));
```

Remove the partitioning keys of a table, such that new data added to the table is no longer partitioned.

```sql
ALTER TABLE tbl RESET PARTITIONED BY;
```

Setting the same partition keys again or resetting an already unpartitioned table is a no-op.

DuckLake supports the following partition clauses:

<div class="monospace_table"></div>

| Transform | Expression             |
|-----------|------------------------|
| identity  | col_name               |
| bucket    | bucket(N, col_name)    |
| year      | year(ts)               |
| month     | month(ts)              |
| day       | day(ts)                |
| hour      | hour(ts)               |
| epoch_year  | epoch_year(ts)       |
| epoch_month | epoch_month(ts)      |
| epoch_day   | epoch_day(ts)        |
| epoch_hour  | epoch_hour(ts)       |

The `epoch_year`, `epoch_month`, `epoch_day`, and `epoch_hour` transforms count whole years, months, days, and hours since January 1, 1970, rounding down, so values before 1970 are negative.
Unlike calendar transforms such as `month(ts)`, epoch transforms distinguish units across years: January 2020 has `month` value `1` and `epoch_month` value `600`.
Epoch transforms use the UTC instant for timestamps with time zones, independently of the session's time zone.
These transforms require DuckLake format version 1.1.

When a column type change affects its bucket hash representation, DuckLake creates a new partition specification for subsequent writes.
Existing files retain their earlier partition specification.

The `target_file_size` option applies to partitioned writes, so a partition can contain multiple files:

```sql
ALTER TABLE tbl SET (target_file_size = '256MB');
```

The size is a target rather than a strict maximum.
