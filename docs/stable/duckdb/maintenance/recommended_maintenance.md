---
layout: docu
title: Recommended Maintenance
---

### Metadata Maintenance

Most operations performed by DuckLake happen in the catalog database.
As such, the maintenance of the metadata server are handled by the chosen catalog database.
For example, when running Postgres, it is likely sufficient to occasionally run `VACUUM` in order to ensure the system stays performant.

### Data File Maintenance

The data files that DuckLake writes to the data directory may require maintenance depending on how the insertions take place.
When snapshots write small batches of data at a time and [data inlining is not used](../advanced_features/data_inlining) small Parquet files will be written to storage.
It is recommended to merge these Parquet files using the [`merge_adjacent_files`](merge_adjacent_files) function.

DuckLake also never deletes old data files. As old data remains accessible through [time travel](../usage/time_travel).
Even when a table is dropped, the data files associated with that table are not deleted.
In order to trigger a delete of these files, the snapshots that refer to that table must be [expired](expire_snapshots).
