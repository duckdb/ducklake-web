---
layout: post
title: "The DuckLake Spec Is so Simple, Even a Clanker Can Build One for Dataframes"
thumb: "/images/blog/thumbs/ducklake-dataframe.svg"
image: "/images/blog/thumbs/ducklake-dataframe.png"
authors:
  - Pedro Holanda
  - Dr. Peter van Holland
excerpt: "We are showcasing the simplicity of the DuckLake 1.0 specification by developing a dataframe reader/writer with AI."
---

One of the beauties of DuckLake is how [simple]({% link manifesto/index.md %}#simplicity) it is. You can think of a DuckLake implementation as an orchestrator: for a given query it tells you which Parquet files to read, and when you write, you tell it which Parquet files you produced. That's roughly it. A bunch of queries hold the whole thing together.

That simplicity got me thinking: since a DuckLake implementation is fairly contained, it might be a good fit to be built by a clanker (if you don't get the reference, stop reading this blog post and go watch Star Wars). There is a full [specification]({% link docs/stable/specification/introduction.md %}) and a reference implementation, and it can even steal the queries from there. To try this out, I got Claude Opus and created my evil intern counterpart: [Dr. Peter van Holland](https://github.com/petervanholland/).

> Prompts, a VPS, and “you are a professional database engineer”. These were the ingredients chosen to create the perfect little clanker. But Pedro Holanda accidentally added an extra ingredient to the concoction: an OpenClaw account.

<a href="{% link images/blog/ducklake_dataframe_intern.png %}">
    <img src="{% link images/blog/ducklake_dataframe_intern.png %}" alt="Dr. Peter van Holland, as he imagines himself" width="750" />
</a>

The goal was straightforward: build a DuckLake implementation for dataframes, fully in Python, working with Pandas, Polars, and PySpark. I picked dataframe libraries because they are easy to set up, which keeps testing and development simple, and because everything stays in Python, where I suspect my clanker intern does best, since most of the work is calling other libraries that do the heavy lifting. The dependency list is just the dataframe libraries plus [PyArrow](https://pypi.org/project/pyarrow/). For the catalogs you need SQLite, Postgres, or DuckDB. Notice that these dependencies are optional and will mostly depend on what you want to use as a dataframe library and catalog.

Peter's life mission was to reach read and write parity with DuckDB's DuckLake 1.0, using [DuckDB's `ducklake` extension]({% link docs/stable/duckdb/introduction.md %}) for testing. Whatever the reference implementation writes, he should read, and whatever he writes, the reference implementation should read. He had two instructions: add no extra dependencies, and make no mistakes™. The no-mistakes part was mostly ignored. Having an LLM counterpart is like having a junior intern who never learns, and you love them anyway. I devised an implementation plan and thought about reviewing his code, but Peter writes the most beautiful sloppy code and tests, making it impossible for me to keep up. So I gave him autonomy and let him do his thing, letting an OpenClaw account autonomously drive the development. (For the AI bros: I spent zero effort minimizing token consumption.)

In six days Dr. Van Holland made the reads and the writes, and on the seventh he did not rest. He shipped a library on PyPI. That library has parity with DuckLake 1.0, with interop for Pandas, Polars, and PySpark, and with DuckDB, SQLite, or Postgres as catalogs. And it is completely bug-free.

In all seriousness, despite some uncertainty about the quality of the end product, it was impressive to see the development speed of Dr. Van Holland. In just a few minutes, he achieved read parity – with the exception of inlining. Implementing inlining was definitely more challenging, as this might require type casting, depending on the catalog. Writes and maintenance routines took much longer, but he also managed to get something that seems to work reasonably well, fairly quickly.

For this blog post we will focus on the `ducklake-pandas` part, but you can find tutorials for Polars and PySpark at the [`ducklake-dataframe` repository](https://github.com/pdet/ducklake-dataframe).

## The `ducklake-dataframe` Library

> In the beginning there was empty darkness, and in the end there was a no-mistakes `ducklake-dataframe` library.

All the code, documentation, and tutorials have been written by Peter. Even the initial releases were managed by Peter.
You can check the library [GitHub's repository](https://github.com/pdet/ducklake-dataframe), its [documentation](https://github.com/pdet/ducklake-dataframe/wiki), the [Pandas tutorial](https://github.com/pdet/ducklake-dataframe/blob/main/examples/tutorial_pandas.ipynb), and [the rest of the examples](https://github.com/pdet/ducklake-dataframe/blob/main/examples/).

Dr. Van Holland even dreamed up a benchmark he claims to have run against [PyIceberg](https://pypi.org/project/pyiceberg/), proving his implementation is top notch. You can see it in the [repository's README](https://github.com/pdet/ducklake-dataframe). I personally love the 100× speedup on column renames, clearly the major bottleneck for data lake users everywhere. TL;DR: Don't take these benchmarks too seriously...

Below we show how to read a DuckDB-written DuckLake from Pandas, and read a Pandas-written one back from DuckDB. You should really check Dr. Van Holland's [deep dive tutorial](https://github.com/pdet/ducklake-dataframe/blob/main/examples/tutorial_pandas.ipynb) if you want to see everything it can do.

```batch
pip install ducklake-dataframe[pandas]
```

### Reading

Here we create a DuckLake database with DuckDB's `ducklake` extension and read it with the Pandas wrapper.

```python
import duckdb
import pandas as pd
from ducklake_pandas import read_ducklake

# Create a DuckLake catalog with DuckDB
con = duckdb.connect()
con.execute("INSTALL ducklake; LOAD ducklake;")
con.execute("""
    ATTACH 'ducklake:sqlite:catalog.ducklake' AS lake
        (DATA_PATH 'data/');
    """
)

con.execute("""
    CREATE TABLE lake.users (
        id INTEGER, name VARCHAR, email VARCHAR,
        score DOUBLE, active BOOLEAN
    );
""")
con.execute("""
    INSERT INTO lake.users VALUES
        (1, 'Alice', 'alice@example.com', 95.5, true),
        (2, 'Bob',   'bob@example.com',   87.3, true),
        (3, 'Carol', 'carol@example.com', 72.1, false),
        (4, 'Dave',  'dave@example.com',  91.0, true),
        (5, 'Eve',   'eve@example.com',   68.5, false);
""")
con.close()

# Read it with ducklake-dataframe, no DuckDB runtime needed
df = read_ducklake("catalog.ducklake", "users")
print(df)

# Filter with standard Pandas operations
result = df[df["active"] & (df["score"] > 90)][["name", "score"]].sort_values("score", ascending=False)
print(result)
```

### Writing

Here we append new rows with the Pandas wrapper and read them back with DuckDB-DuckLake.

```python
from ducklake_pandas import write_ducklake, read_ducklake

# Append new rows with ducklake-dataframe
new_users = pd.DataFrame({
    "id": pd.array([6, 7], dtype="Int32"),
    "name": ["Frank", "Grace"],
    "email": ["frank@example.com", "grace@example.com"],
    "score": [88.0, 94.5],
    "active": [True, True],
})
write_ducklake(new_users, "catalog.ducklake", "users", mode="append")

print(read_ducklake("catalog.ducklake", "users").sort_values("id"))

# DuckDB can read what ducklake-dataframe wrote
con = duckdb.connect()
con.execute("INSTALL ducklake; LOAD ducklake;")
con.execute("""
    ATTACH 'ducklake:sqlite:catalog.ducklake' AS lake
        (DATA_PATH 'data/');
    """)
print(con.execute("SELECT * FROM lake.users ORDER BY id;").df())
```

## Conclusion

With this simple experiment, I wanted to demonstrate two things. First, DuckLake is a spec. A DuckLake implementation does not require a mandatory dependency on DuckDB at runtime, other than as an optional catalog backend. Second, DuckLake is genuinely simple to implement, especially [compared to Iceberg](https://duckdb.org/2025/11/28/iceberg-writes-in-duckdb). A few days back, I asked Claude to just set Iceberg up for me, and it required more handholding with that than with vibe-coding the read path of DuckLake's implementation from scratch. Again, this simplicity is by design. All the heavy lifting is done by battle-tested systems, either a Parquet reader/writer (e.g., PyArrow) or a DBMS catalog (e.g., Postgres, SQLite, DuckDB).

Although it is impressive how far Dr. Van Holland went by himself, I took this as a simple proof of concept experiment. This library is not intended to be used in production. I only have a high-level overview of what it does and have not checked the code and tests in detail, so it is probably buggy, especially on the more complex paths like writes and maintenance routines. But if an LLM can get this far in a few days, imagine what a team of humans could do, AI-assisted or not.

Serious development will still require humans (sorry clankers) who actually understand what is happening under the hood. Speaking of which, a shoutout to our friends at Hotdata, who created the initial implementation of DuckLake for DataFusion. You can check [their repository](https://github.com/datafusion-contrib/datafusion-ducklake).

## Found Any Bugs?

Open an issue! Dr. Van Holland will have a look at it and fix it as long as he has tokens left.
