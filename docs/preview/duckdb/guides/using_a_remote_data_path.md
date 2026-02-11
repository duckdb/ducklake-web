---
layout: docu
title: Using a Remote Data Path
---

This guide shows how to set up and load a DuckLake locally, where the DuckLake will be served on an `https://` endpoint.

> Tip DuckLake currently does not allow you to change the persisted data path in the catalog.
> This is a known limitation that will be lifted in the future, rendering the future version of this guide almost trivial.

In this guide, we assume that we want to create a DuckLake at `https://blobs.duckdb.org/datalake/tpch-sf1/` to serve a read-only copy of the TPC-H SF1 dataset.

## Initializing the DuckLake

We initialize the DataLake using the _remote URL as the data path_ and immediately detach from the DuckLake:

```sql
ATTACH 'tpch-sf1.ducklake' AS tpch_sf1_ducklake (
    TYPE ducklake,
    DATA_PATH 'https://blobs.duckdb.org/datalake/tpch-sf1'
);
DETACH tpch_sf1_ducklake;
```

## Generating the Data

We generate the data using the [`tpchgen-cli`](https://github.com/clflushopt/tpchgen-rs/) tool:

```batch
tpchgen-cli --scale-factor 1 --format parquet
```

## Populating the DuckLake

We attach to the DuckLake with a _local data path_ using the `OVERRIDE_DATA_PATH true` flag:

```sql
ATTACH 'tpch-sf1.ducklake' AS tpch_sf1_ducklake (
    TYPE ducklake,
    DATA_PATH 'tpch-sf1',
    OVERRIDE_DATA_PATH true
);
USE tpch_sf1_ducklake;
```

We then load the data into the DuckLake:

```sql
CREATE TABLE customer AS FROM 'customer.parquet';
CREATE TABLE lineitem AS FROM 'lineitem.parquet';
CREATE TABLE nation AS FROM 'nation.parquet';
CREATE TABLE orders AS FROM 'orders.parquet';
CREATE TABLE part AS FROM 'part.parquet';
CREATE TABLE partsupp AS FROM 'partsupp.parquet';
CREATE TABLE region AS FROM 'region.parquet';
CREATE TABLE supplier AS FROM 'supplier.parquet';
```

Finally, we close DuckDB with `Ctrl + D` or `.quit`.

## Uploading the DuckLake

Now, we have the `tpch-sf1.ducklake` file and the `tpch-sf1/` directory with the Parquet files:

```batch
tree tpch-sf1
```

```text
tpch-sf1
└── main
    ├── customer
    │   └── ducklake-019a2726-0362-7eae-8a4d-1404ead2c506.parquet
    ├── lineitem
    │   └── ducklake-019a2726-03ad-7d79-b28a-6ae3f114fbd3.parquet
    ├── nation
    │   └── ducklake-019a2726-055d-7f55-914d-02787bda2eae.parquet
    ├── orders
    │   └── ducklake-019a2726-0579-72e2-be9e-0190b3f8f8af.parquet
    ├── part
    │   └── ducklake-019a2726-05fd-7d30-8051-a9172d75f815.parquet
    ├── partsupp
    │   └── ducklake-019a2726-0645-765b-9456-6ba632d8288b.parquet
    ├── region
    │   └── ducklake-019a2726-06a4-7b3a-9788-8f32006be0ad.parquet
    └── supplier
        └── ducklake-019a2726-06bb-72f4-97b3-131d7186787e.parquet
```

We upload both of these to `https://blobs.duckdb.org/datalake/`.
This particular URL is served by Cloudflare and is based on the content of a public Cloudflare R2 bucket – but DuckLake works with any `http(s)://` URL.

## Using the DuckLake

You can now attach to the remote DuckLake as follows:

```sql
ATTACH 'https://blobs.duckdb.org/datalake/tpch-sf1.ducklake' AS tpch_sf1_ducklake (TYPE ducklake);
USE tpch_sf1_ducklake;
```

Now you can use it like any other DuckDB database or DuckLake:

```sql
SELECT count(*) FROM lineitem;
```

```text
┌────────────────┐
│  count_star()  │
│     int64      │
├────────────────┤
│    6001215     │
│ (6.00 million) │
└────────────────┘
```
