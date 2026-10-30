---
layout: post
title: "Frozen DuckLakes for Multi-User, Serverless Data Access"
authors:
  - Mark Harrison
thumb: "/images/blog/thumbs/frozen-ducklake.svg"
image: "/images/blog/thumbs/frozen-ducklake.png"
excerpt: "We show how you can build high-performance data lakes with no moving parts."
---

> This is a guest blog post by [Mark Harrison](https://www.linkedin.com/in/marhar) ([Madhive](https://www.madhive.com) Data Engineering).

[DuckLakes]({% link index.html %}) typically consist of two components: the catalog database and the storage. Obviously, there is no way around having some sort of storage to represent the data. But can we host a DuckLake without setting up a catalog database? In this blog post, we'll show how you can create a read-only cloud-based DuckLake without a database server. We call this a **“Frozen DuckLake”** because it is read-only and has no moving parts other than a cloud storage system. Maybe you do want to [build a snowman](https://www.youtube.com/watch?v=TeQ_TTyLGMs), too!

![Frozen DuckLake at a glance]({% link images/blog/frozen-ducklake/frozen-ducklake-at-a-glance-light.svg %}){: .lightmode-img }
![Frozen DuckLake at a glance]({% link images/blog/frozen-ducklake/frozen-ducklake-at-a-glance-dark.svg %}){: .darkmode-img }

Frozen DuckLakes have several advantages:

* They have almost zero cost overhead on top of the storage of the Parquet data files.
* A Frozen DuckLake can be used for public-facing data (e.g., public buckets), since there are no extra services required over cloud or HTTP file access.
* They make the data immediately accessible in a SQL database with no special provisions required.
* They allow data files to live in different cloud environments, while being referenced from the same Frozen DuckLake.

And, best of all, while a “Frozen DuckLake” is indeed frozen in time, the data can still be updated by creating a _new_ Frozen DuckLake.
Older versions can be accessed by retaining revisions of the DuckDB database file – or by simply using [time travel]({% link docs/stable/duckdb/usage/time_travel.md %}). For example, to travel back one week, you can use:

```sql
FROM table AT (TIMESTAMP => (now() - "1 week"::INTERVAL));
```

## Designing Frozen DuckLakes

### Setup and Requirements

When we started looking at using DuckLake for storing some archival data, our setup looked as follows:

* The data was read-only and stored in cloud buckets.
* We had a multi-reader, single-writer model, where one process would periodically update the archive.

We had three requirements that we wanted to meet:

* An external program was creating the Parquet files – we didn't want to disrupt that workflow.
* We didn't want to support, pay for, or operate a cloud database server in order to have an archive.
* We did not want to block a traditional multi-user DuckLake running in parallel with our read-only archival copy.

### Design

First, our workflow continues to store Parquet files organized into buckets on our cloud storage system. This is a write-once system – once Parquet files have been written, they are neither modified nor moved.

Second, we periodically snapshot the state of these Parquet files into a DuckLake. Using the `ducklake_add_data_files()` function allows us to quickly ingest all the data in one Parquet file. This is a fast, read-only operation, since DuckLake only needs to read the Parquet metadata. We do this on a single computer, writing to a local DuckDB-formatted DuckLake file. All data references are to the Parquet files in the cloud buckets. This gives us a working single-user DuckLake, resident on a single machine. We then “publish” the DuckLake file by copying it to cloud storage. Once it has been published, the DuckLake can be accessed in read-only mode by any client that can access the cloud storage.

We call the snapshotting and publishing steps **“freezing a DuckLake”**. In the rest of this post, we'll show a live demo on GitHub, then go into the details of creating and deploying Frozen DuckLakes using object storage (AWS S3 or compatible) and HTTPS.

![Frozen DuckLake overview]({% link images/blog/frozen-ducklake/frozen-ducklake-overview-light.svg %}){: .lightmode-img }
![Frozen DuckLake overview]({% link images/blog/frozen-ducklake/frozen-ducklake-overview-dark.svg %}){: .darkmode-img }

## Live Demo

Here's a small database of space missions that lives on GitHub. You can access this database with this command and try the following queries yourself.

```batch
duckdb ducklake:https://raw.githubusercontent.com/marhar/frozen/main/space.ducklake
```

```sql
SHOW TABLES;
```

```text
┌──────────────┐
│     name     │
│   varchar    │
├──────────────┤
│ astronauts   │
│ mission_crew │
│ missions     │
│ spacecraft   │
└──────────────┘
```

We can list the space missions with the most countries represented like so:

```sql
SELECT
    m.name as mission,
    count(DISTINCT a.nationality) AS nationalities,
    string_agg(DISTINCT a.nationality, ', ') AS countries_represented
FROM missions m
JOIN mission_crew mc ON m.mission_id = mc.mission_id
JOIN astronauts a ON mc.astronaut_id = a.astronaut_id
WHERE mc.primary_crew = true
GROUP BY m.mission_id, m.name
HAVING count(DISTINCT a.nationality) > 1
ORDER BY nationalities DESC
LIMIT 4;
```

```text
┌─────────────────────────────┬──────────────┬────────────────────────────────────────────────┐
│           mission           │ nationalities│             countries_represented              │
│           varchar           │     int64    │                    varchar                     │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────┤
│ International Space Station │            7 │ Italy, UK, Denmark, USA, France, Japan, Russia │
│ SpaceX Crew-5               │            5 │ Denmark, Italy, Germany, Japan, USA            │
│ SpaceX Crew-7               │            4 │ Denmark, Italy, USA, France                    │
│ SpaceX Crew-6               │            4 │ Denmark, Japan, Italy, France                  │
└─────────────────────────────┴──────────────┴────────────────────────────────────────────────┘
```

This query was served from a Frozen DuckLake, using only storage; you can see the files in the GitHub repo.

## Creating and Freezing a DuckLake

There are four steps required to create and freeze a DuckLake:

1. Collect the list of data files to include in the DuckLake.
2. Generate a DuckLake creation script. The script must take care of the table creation and the data population.
3. Create the local DuckLake.
4. Publish the DuckLake.

Visually, the process looks as follows:

![Procedure of creating a frozen DuckLake]({% link images/blog/frozen-ducklake/frozen-ducklake-creation-procedure-light.svg %}){: .lightmode-img }
![Procedure of creating a frozen DuckLake]({% link images/blog/frozen-ducklake/frozen-ducklake-creation-procedure-dark.svg %}){: .darkmode-img }

We will go into detail on each of these steps below. Complete scripts are available in the [`marhar/duckdb_tools` GitHub repository](https://github.com/marhar/duckdb_tools/tree/main/frozen-ducklake).

### Collecting the List of Data Files

In a typical Frozen DuckLake scenario, there is another program which is already creating the Parquet files that are going to be frozen and published. It could be a periodic archival system, an ML data system that is collecting and organizing training data, or even another live DuckLake. The key requirements of the data generating system are:

* They must generate Parquet files and put them in some accessible storage system.
* The table name related to each file can be derived from the path or filename. For example, `stations.2025-01.parquet` might be the dump of station information for January 2025\. (Of course, if you have appropriate metadata from the generating system, you could use that as well. For example, there might be metadata relating the file `6235b4d2611184.parquet` to the stations table.)

> **Multi-site Frozen DuckLakes.** A Frozen DuckLake is not limited to referencing data files in a single repository or data store. File references to multiple sites can be added when creating the DuckLake file. This might be an effective way to integrate two independent systems that are operating in different environments.

If we are using cloud storage directly supported by DuckDB such as S3 or GCS, the task is made very simple using DuckDB's built-in [recursive file globbing](https://duckdb.org/docs/current/data/multiple_files/overview.html#multi-file-reads-and-globs):

```sql
COPY (
    SELECT file AS full_path
    FROM glob('s3://mybucket/mypath/**/*.parquet')
) TO 'tmp_files.csv';
```

If we are building a list of data files which are stored on GitHub, we will have to use the GitHub API to query and traverse the GitHub repository, using logic like this in [`github-filelist.sh`](https://github.com/marhar/duckdb_tools/blob/main/frozen-ducklake/bin/github-filelist.sh):

```bash
pprocess() {
    CPATH=https://api.github.com/repos/$REPO/contents/$DPATH
    curl -s $CPATH > $TMPJ

    # print Parquet files, then recurse into all subdirs
    duckdb -noheader -ascii -c "
        SELECT download_url FROM '$TMPJ'
        WHERE type='file' AND name LIKE '%.parquet'
        ORDER BY name;"
    for DPATH in $(duckdb -noheader -ascii -c "
                             SELECT path FROM '$TMPJ' WHERE type='dir'
                             ORDER BY name;"); do
        process $REPO $DPATH
    done
}
echo full_path > tmp_files.csv
process $REPO $DPATH >> tmp_files.csv
```

Full code for both of these methods is in the repository mentioned above, as [`cloud-filelist.sh`](https://github.com/marhar/duckdb_tools/blob/main/frozen-ducklake/bin/cloud-filelist.sh) and [`github-filelist.sh`](https://github.com/marhar/duckdb_tools/blob/main/frozen-ducklake/bin/github-filelist.sh). If you need to implement a custom file lister, one of these might be a good model.

If the storage location is on GitHub (such as in our demo), we would run a command like this. Note the extra `/tree/main/` in the path:

```batch
./github-filelist.sh https://github.com/marhar/frozen/tree/main/space
```

![The URL used by github-filelist.sh]({% link images/blog/frozen-ducklake/github-filelist-url.png %})

On a cloud provider, we would run something like this.

```batch
./cloud-filelist.sh s3://mybucket/myfolder
```

In any case, the output of these programs is the same: a CSV file with a single field, the full path of the data file, which will act as the input to the next step.

```text
full_path
https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p1.parquet
https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p2.parquet
https://raw.githubusercontent.com/marhar/frozen/main/space/mission_crew.p1.parquet
...
```

### Generating the Creation Scripts

The file [`create-import-scripts.sql`](https://github.com/marhar/duckdb_tools/blob/main/frozen-ducklake/bin/create-import-scripts.sql) contains the logic to create the two SQL files necessary to generate the local DuckLake.

You can customize any parameter creation logic (such as changing how table names are derived) in the `frozen_parms` table. The default code names the local DuckLake file as `myfrozen.ducklake`, which you can change when you publish.

The generated file `tmp_create_tables.sql` contains one line for each table that looks something like this. The schema of the first Parquet file associated with each table is used to specify the schema.

```sql
CREATE TABLE myfrozen.astronauts AS
   SELECT *
   FROM read_parquet('https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p1.parquet')
   WITH NO DATA;
```

`WITH NO DATA` is a DuckDB extension; it does the same thing as `LIMIT 0` but emphasizes that no data will be fetched or processed.

The generated file `tmp_add_data_files.sql` should contain one line per Parquet file that looks like this, calling `ducklake_add_data_files` with the attach name, table name, and a duckdb-readable file reference.

```sql
CALL ducklake_add_data_files(
    'myfrozen',
    'astronauts',
    'https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p2.parquet'
);
```

### Creating the Local DuckLake

After the two SQL files have been generated, run these commands in a DuckDB session.

```sql
LOAD ducklake;
LOAD httpfs;
ATTACH 'ducklake:myfrozen.ducklake' AS myfrozen
    (DATA_PATH 'tmp_always_empty');
.read tmp_create_tables.sql
.read tmp_add_data_files.sql
```

The result will be a local DuckDB flavor DuckLake file called `myfrozen.ducklake`. You can attach to this DuckLake and verify your data is as you expect. Note that the `DATA_PATH` will be populated with one empty subdirectory per table. The `DATA_PATH` should otherwise be completely empty, since we only populate the Frozen DuckLake with `ducklake_add_data_files()`. During access time, this directory is not referred to, and does not need to be taken into account when publishing. Note that we could actually skip specifying the data path in this example, but we want to emphasize that (unlike a non-frozen DuckLake) the directory is not needed.

> **`DATA_PATH` for cloud-based Frozen DuckLakes.** Specify the data path as a cloud storage bucket, e.g., `(DATA_PATH 's3://tmp_always_empty')`, to ensure the appropriate storage module will be autoloaded when DuckDB attaches to the DuckLake.

### Idempotent File Addition

Note that calling `ducklake_add_data_files()` multiple times on the same file will result in the data being duplicated. A future version of this function may add an “only-once” flag; until then, we can see if the file has been added by looking at the `path` column in the `ducklake_data_file` table.

When adding file `X.parquet`:

```sql
- if X.parquet NOT IN column ducklake_data_path.path:
  - CALL ducklake_add_data_files(..., X.parquet)
```

Note that you would have to take care that the paths are resolved correctly, as per the DuckLake documentation's [Paths page]({% link docs/stable/duckdb/usage/paths.md %}). For example, the two different strings `/foo/bar.parquet` and `/foo/./bar.parquet` refer to the same file.  This won't be an issue if all the file paths are generated relative to the same base directory.

### Publishing

If you are using cloud storage, simply copy your local DuckLake file to cloud storage, e.g.:

```batch
aws s3 cp myfrozen.ducklake s3://mybucket/space-missions.ducklake
```

In our GitHub-based example, we just added the DuckLake file to the repository. (Note that for real-world deployments, you probably won't be storing large databases in GitHub.)

Note that the `DATA_PATH` specified in the `ATTACH` command will never be populated with data. It does not need to be copied to the cloud, and can be deleted once the DuckLake has been frozen.

### Accessing the (Now Frozen) DuckLake

Once the DuckLake file has been published to the cloud, you can access it using any of the standard DuckLake methods

Using `ATTACH`, and providing the cloud reference:

```sql
ATTACH 'ducklake:https://raw.githubusercontent.com/marhar/frozen/main/space.ducklake' AS space;
USE space;
```

Using the DuckLake `ducklake:` syntax:

```batch
duckdb ducklake:https://raw.githubusercontent.com/marhar/frozen/main/space.ducklake
```

### Updating

Updating a Frozen DuckLake is straightforward. The simplest method is to regenerate and publish the DuckLake file from scratch using the process above. If that's too slow, and if you are able to track which files have been newly added, you can just update the local DuckDB by calling `ducklake_add_data_files()` for the new files and republish the updated DuckLake file.

### Versioning

When DuckDB detects a new DuckLake version it will automatically upgrade its schema. Of course, this isn't possible for the read-only Frozen DuckLake, so you have to upgrade the DuckLake file manually.

* Download the DuckLake file.
* Attach to the local DuckLake file with DuckDB.
* Perform any DuckLake query; `SHOW TABLES` is a convenient one.
* This triggers the DuckLake schema upgrade.
* Copy the upgraded file back to cloud storage.

If you don't have control of the clients accessing your Frozen DuckLake it might be useful to copy your original DuckLake and publish it under a new name so that older clients can access it.

### Executing the Workflow

Executing the sample workflow file in the repository produces the following output...

```batch
./sample-workflow.sh
```

```sql
LOAD ducklake;
LOAD httpfs;

ATTACH 'ducklake:myfrozen.ducklake'
    AS myfrozen (DATA_PATH 'tmp_always_empty');

CREATE TABLE myfrozen.astronauts AS
    SELECT *
    FROM read_parquet('https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p1.parquet')
    WITH NO DATA;

CREATE TABLE myfrozen.mission_crew AS
    SELECT *
    FROM read_parquet('https://raw.githubusercontent.com/marhar/frozen/main/space/mission_crew.p1.parquet')
    WITH NO DATA;

...

CALL ducklake_add_data_files(
    'myfrozen',
    'astronauts',
    'https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p1.parquet'
);

CALL ducklake_add_data_files(
    'myfrozen',
    'astronauts',
    'https://raw.githubusercontent.com/marhar/frozen/main/space/astronauts.p2.parquet'
);

CALL ducklake_add_data_files(
    'myfrozen',
    'mission_crew',
    'https://raw.githubusercontent.com/marhar/frozen/main/space/mission_crew.p1.parquet'
);

...
```

```text
┌──────────────┐
│     name     │
│   varchar    │
├──────────────┤
│ astronauts   │
│ mission_crew │
│ missions     │
│ spacecraft   │
└──────────────┘
```

## Performance

Creating and publishing a Frozen DuckLake with about 11 billion rows, stored in 4,030 S3-based Parquet files took about 22 minutes on my MacBook using a Wi-Fi connection.

```text
tables:	                       66
parquet files:                 4030
total parquet file size:       247.7G
total rows:                    10,852,000,226

Preparing the build script:    1.3 seconds
Building the Frozen DuckLake:  21:47 minutes (about 3 files/sec)
```

## Summary

In this blog post, we showed how to create a **Frozen DuckLake** which only uses a storage component to represent data, including a read-only DuckDB database file. We also showed how to create new revisions of a Frozen DuckLake.

This post does not cover schema migration; if demand warrants, we'll address this topic in a future blog post.

## Acknowledgements

Thanks to [Jenna Jordan](https://jennajordan.me/) of Ratio PBC for reviewing and providing valuable suggestions.
