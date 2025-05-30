# Contributing

* [Contributing](#contributing)
  * [Code of Conduct](#code-of-conduct)
  * [Contributing to the DuckLake Documentation](#contributing-to-the-ducklake-documentation)
  * [Adding a New Page](#adding-a-new-page)
  * [Style Guide](#style-guide)
    * [Formatting](#formatting)
    * [Headers](#headers)
    * [SQL Style](#sql-style)
    * [Spelling](#spelling)
  * [Example Code Snippets](#example-code-snippets)
  * [Cross-References](#cross-references)

## Code of Conduct

This project and everyone participating in it is governed by a [Code of Conduct](code_of_conduct.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [quack@duckdb.org](mailto:quack@duckdb.org).

## Contributing to the DuckLake Documentation

Contributions to the [DuckLake Documentation](https://duckdb.org/) are welcome. To submit a contribution, please open a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) in the [`duckdb/ducklake-web`](https://github.com/ducklake/duckdb-web) repository.

## Adding a New Page

Thank you for contributing to the DuckLakeB documentation!

Each new page requires at least 2 edits:

* Create new Markdown file (using the `snake_case` naming convention). Please follow the format of another `.md` file in the `docs/stable` folder.
* Add a link to the new page within `_data/menu_docs_stable.json`. This populates the side menu.

When creating a PR, please check the box to "Allow edits from maintainers".

## Style Guide

Please adhere the following style guide when submitting a pull request.

Some of this style guide is automated with GitHub Actions, but feel free to run [`scripts/lint.sh`](scripts/lint.sh) to run them locally.

### Formatting

* Use [GitHub's Markdown syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) for formatting.
* Do not hard-wrap lines in blocks of text.
* Format code blocks with the appropriate language (e.g., \`\`\`sql CODE\`\`\`).
* For a SQL code block to start with DuckDB's `D` prompt, use the `plsql` language tag (e.g., \`\`\`plsql CODE\`\`\`). This uses the same syntax highlighter as SQL, the only difference is the presence of the `D` prompt.
* Code blocks using the `bash` language tag automatically receive `$` prompt when rendered. To typeset a Bash code block without a prompt, use the `batch` language tag (e.g., \`\`\`batch CODE\`\`\`). This uses the same syntax highlighter as Bash, the only difference is the absence of the prompt.
* To display blocks of text without a language (e.g., output of a script), use \`\`\`text OUTPUT\`\`\`.
* To display error messages, use \`\`\`console ERROR MESSAGE\`\`\`.
* Quoted blocks (lines starting with `>`) are rendered as [a colored box](https://duckdb.org/docs/data/insert). The following box types are available: `Note` (default), `Warning`, `Tip`, `Bestpractice`, `Deprecated`.
* Always format SQL code, variable names, function names, etc. as code. For example, when talking about the `CREATE TABLE` statement, the keywords should be formatted as code.
* When presenting SQL statements, do not include the prompt (`D `).
* SQL statements should end with a semicolon (`;`) to allow readers to quickly paste them into a SQL console.
* Tables with predominantly code output (e.g., the result of a `DESCRIBE` statement) should be prepended with an empty div that has the `monospace_table` class: `<div class="monospace_table"></div>`.
* Tables where the headers should be center-aligned (opposed to the left-aligned default) should be prepended with an empty div that has the `center_aligned_header_table` class: `<div class="center_aligned_header_table"></div>`.
* Do not introduce hard line breaks if possible. Therefore, avoid using the `<br/>` HTML tag and avoid [double spaces at the end of a line in Markdown](https://spec.commonmark.org/0.28/#hard-line-breaks).
* Single and double quote characters (`'` and `"`) are not converted to smart quotation marks automatically. To insert these, use `“` `”` and `‘` `’`.
* When referencing other articles, put their titles in quotes, e.g., `see the [“Lightweight Compression in DuckDB” blog post]({% post_url 2022-10-28-lightweight-compression %})`.
* For unordered lists, use `*`. If the list has multiple levels, use **4 spaces** for indentation.

> [!TIP]
> In VS Code, you can configure the [Markdown All in One extension](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) to use asterisk as the default marker when generating a table of content for a page using the following setting in `settings.json`:
> `"markdown.extension.toc.unorderedList.marker": "*"`

### Headers

* The title of the page should be encoded in the front matter's `title` property. The body of the page should not start with a repetition of this title.
* In the body of the page, restrict the use of headers to the following levels: h2 (`##`), h3 (`###`), and h4 (`####`).
* Use headline capitalization as defined in the [Chicago Manual of Style](https://capitalizemytitle.com/style/Chicago/).

### SQL Style

* Use **4 spaces** for indentation.
* Use uppercase SQL keywords, e.g., `SELECT 42 AS x, 'hello world' AS y FROM ...;`.
* Use lowercase function names, e.g., `SELECT cos(pi()), date_part('year', DATE '1992-09-20');`.
* Use snake case (lowercase with underscore separators) for table and column names, e.g., `SELECT departure_time FROM train_services;`
* Add spaces around commas and operators, e.g., `SELECT FROM tbl WHERE x > 42;`.
* Add a semicolon to the end of each SQL statement, e.g., `SELECT 42 AS x;`.
* Commas should be placed at the end of each line.
* _Do not_ add clauses or expressions purely for aligning lines. For example, avoid adding `WHERE 1 = 1` and `WHERE true`.
* _Do not_ include the DuckDB prompt. For example, avoid the following: `D SELECT 42;`.
* Employing DuckDB's syntax extensions, e.g., the [`FROM-first` syntax](https://duckdb.org/docs/sql/query_syntax/from) and [`GROUP BY ALL`](https://duckdb.org/docs/sql/query_syntax/groupby#group-by-all), is allowed but use them sparingly when introducing new features.
* The returned tables should be formatted using the DuckDB CLI's markdown mode (`.mode markdown`) and NULL values rendered as `NULL` (`.nullvalue NULL`).
* Output printed on the system console (e.g., in Python) and system messages (e.g., errors) should be formatted as code with the `text` language tag. For example:
   ````
   ```text
   Error: Constraint Error: Duplicate key "i: 1" violates primary key constraint.
   ```
   ````
* To specify placeholders (or template-style code), use the left angle and right angle characters, `⟨` and `⟩`. These will be highlighted in red and typeset in monospace bold italic to draw the reader's attention to them.
     * For example, you could write: To create a table from a Parquet file, run: `CREATE TABLE ⟨your_table_name⟩ AS FROM '⟨your_filename⟩.parquet'`.
     * Copy the characters from here: `⟨⟩`.
     * These characters are known in LaTeX code as `\langle` and `\rangle`.
     * *Avoid* using arithmetic comparison characters, `<` and `>`, brackets, `[` and `]`, braces, `{` and `}`, for this purpose.

### Spelling

* Use [American English (en-US) spelling](https://en.wikipedia.org/wiki/Oxford_spelling#Language_tag_comparison).
* Avoid using the Oxford comma.

## Example Code Snippets

* Examples that illustrate the use of features are very welcome. Where applicable, consider starting the page with a few simple examples that demonstrate the most common uses of the feature described.
* If possible, examples should be self-contained and reproducible. For example, the tables used in the example must be created as a part of the example code snippet.

## Cross-References

* Where applicable, add cross-references to relevant other pages in the documentation.
* Use Jekyll's [link tags](https://jekyllrb.com/docs/liquid/tags/#link) to link to pages.
* In most cases, linking related GitHub issues/discussions is discouraged. This allows the documentation to be self-contained.
