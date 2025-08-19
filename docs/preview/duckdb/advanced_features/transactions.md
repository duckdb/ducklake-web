---
layout: docu
title: Transactions
---

DuckLake has full support for [ACID](https://en.wikipedia.org/wiki/ACID) and offers snapshot isolation for all interactions with the database.
All operations, including DDL statements such as `CREATE TABLE` or `ALTER TABLE`, have full transactional support.
Transactions have all-or-nothing semantics and can be composed of multiple changes that are made to the database.
