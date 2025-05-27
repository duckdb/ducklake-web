---
layout: docu
title: Choosing Storage
---

DuckLake as a concept will *never* change existing files, neither by changing existing content nor by appending to existing files. This greatly reduces the consistency requirements of file systems and greatly simplifies caching.

The DuckDB `ducklake` extension can work with any file system backend that DuckDB supports. This currently includes: 
- local files and folders
- cloud object store like 
  - [AWS S3](https://duckdb.org/docs/stable/core_extensions/httpfs/s3api.html) and compatible (e.g. [CloudFlare R2](https://www.cloudflare.com/developer-platform/products/r2/), [Hetzner Object Storage](https://www.hetzner.com/storage/object-storage/), etc.)
  - [Google Cloud Storage](https://duckdb.org/docs/stable/guides/network_cloud_storage/gcs_import.html)
  - [Azure Blob Store](https://duckdb.org/docs/stable/core_extensions/azure.html)
- virtual network attached file systems
  - [NFS](https://en.wikipedia.org/wiki/Network_File_System)
  - [SMB](https://en.wikipedia.org/wiki/Server_Message_Block)
  - [FUSE](https://en.wikipedia.org/wiki/Filesystem_in_Userspace)
  - Python [fsspec file systems](https://duckdb.org/docs/stable/guides/python/filesystems.html)
  ...


When choosing storage, its important to consider the following factors
- *access latency and data transfer throughput*, a cloud further away will be accessible to everyone but have a higher latency. local files are very fast, but not accessible to anyone else. A compromise might be a site-local storage server.
- *scalability and cost*, an object store is quite* scalable, but potentially charges for data transfer. A local server might not incur significant operating expenses, but might struggle serving thousands of clients.

It might also be interesting to use DuckLake encryption when choosing external cloud storage.