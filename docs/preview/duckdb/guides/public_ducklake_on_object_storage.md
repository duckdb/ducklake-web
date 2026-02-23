---
layout: docu
title: Public DuckLake on Object Storage
---

This guide explains how to set up a **public read-only DuckLake** on object storage such as Amazon S3, Backblaze B2, Cloudflare R2, [Leafcloud Object Storage](https://szarnyasg.org/posts/ducklake-on-leafcloud/), etc.
Users can query this DuckLake through HTTPS **without authentication**.

> Warning Please check the pricing models of the providers to understand the costs of serving DuckLakes.

> The setup described here is conceptually similar to [Frozen DuckLakes]({% post_url 2025-10-24-frozen-ducklake %}) but it is simpler to set up.

## Steps

### Creating the Bucket

Create a new public bucket:

* [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
* [Backblaze B2](https://www.backblaze.com/docs/cloud-storage-create-and-manage-buckets)
* [Cloudflare R2](https://developers.cloudflare.com/r2/buckets/create-buckets/)

Make sure that the bucket is accessible through the internet. The exact settings for this vary from platfrom to platform.

### Creating the DuckLake

Create a new DuckLake following the [“Using a Remove Data Path” guide]({% link docs/preview/duckdb/guides/using_a_remote_data_path.md %}) using DuckDB as the catalog database and set the data path to the `https://` URL that serves your bucket.

### Uploading the DuckLake

Upload the `.ducklake` file and its data directory to the bucket. We recommend using [Rclone](https://rclone.org/), which supports all object storage platforms listed above.

```bash
rclone config
```

Create a new Rclone remote (see the details in the foldouts below). In our examples, we will call this `⟨your_rclone_remote⟩`{:.language-sql .highlight}.

<details markdown='1'>
<summary markdown='span'>
Storage configuration in Rclone
</summary>
```text
Option Storage.
Type of storage to configure.
Choose a number from below, or type in your own value.
...
Storage> s3
```
</details>

To upload your data to the R2 bucket, run:

```sql
rclone cp -v ⟨your_ducklake_catalog.ducklake⟩ ⟨your_rclone_remote⟩:⟨your_bucket_name⟩/⟨path⟩/
rclone sync -v ⟨your_ducklake_directory⟩ ⟨your_rclone_remote⟩:⟨your_bucket_name⟩/⟨path⟩/
```

### Cloudflare: Setting the CORS Policy for Browser Access

If you are using Cloudflare as your storage and try to query the dataset from another website – such as the [online DuckDB shell](https://shell.duckdb.org/) –, you will get an error due to the CORS (Cross-Origin Resource Sharing) security mechanism:

```console
IO Error: Failed to attach DuckLake MetaData "__ducklake_metadata_..." at path + "..."
Cannot open database "..." in read-only mode: database does not exist
```

or

```console
Invalid Error: Failed to attach DuckLake MetaData "__ducklake_metadata..." at path + "..."
Opening file '...' failed with error:
NetworkError: Failed to execute 'send' on 'XMLHttpRequest': Failed to load '...'.
```

To allow querying the dataset, add a CORS policy to the Cloudflare configuration of the bucket. How to do this depends on whether you are serving directly from the bucket or through a Cloudflare Worker.

If you are serving through a Cloudflare Worker, [edit the code of the Worker following the “CORS header proxy”](https://developers.cloudflare.com/workers/examples/cors-header-proxy/) and add the following to the JavaScript code of your `fetch` function:

```js
const allowedOrigins = [
  "https://duckdb.org",
  "https://shell.duckdb.org",
];

const origin = request.headers.get("Origin");

let corsOrigin = "";

if (allowedOrigins.includes(origin)) {
  corsOrigin = origin;
}
return new Response(object.body, {
  headers: {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": corsOrigin,
    "Cache-Control": "public, max-age=3600",
  }
});
```

If you are serving directly from the bucket, navigate to its settings and add the following CORS Policy:

```json
[
  {
    "AllowedOrigins": [
      "https://duckdb.org",
      "https://shell.duckdb.org"
    ],
    "AllowedMethods": [
      "GET"
    ]
  }
]
```

For the complete Cloudflare guide on CORS policies, see the [“Configure CORS” page](https://developers.cloudflare.com/r2/buckets/cors/).
