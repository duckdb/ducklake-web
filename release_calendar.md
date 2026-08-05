---
layout: default
redirect_from:
- /cal
- /release-calendar
title: Release Calendar
body_class: release-calendar blog_typography post
max_page_width: medium
toc: false
---

<div class="wrap pagetitle">
  <h1>Release Calendar</h1>
</div>

DuckLake follows [semantic versioning](https://semver.org/spec/v2.0.0.html).
Larger new features are introduced in minor versions,
while patch versions mostly contain bugfixes.

## Upcoming Releases

Upcoming releases are shown in the table below. **Please note that these dates are tentative** and DuckLake maintainers may decide to push back release dates to ensure the stability and quality of releases. DuckLake specification releases are currently tied to `ducklake` extension releases, this may change in the future. It is also worth mentioning that some `ducklake` extension releases may have a dependency on DuckDB and therefore will need to adjust to the [DuckDB release calendar](https://duckdb.org/release_calendar).

<!-- markdownlint-disable MD055 MD056 MD058 -->

{% if site.data.upcoming_releases.size > 0 %}
| Release date | Spec. version | Extension version |
|-------------:|--------------:|------------------:|
{%- for release in site.data.upcoming_releases reversed %}
| {{ release.start_date }} | {{ release.ducklake_spec }} | {{ release.ducklake_extension }} |
{%- endfor %}
{% else %}
_There are no upcoming releases announced at the moment. Please check back later._
{% endif %}

<!-- markdownlint-enable MD055 MD056 MD058 -->

## Past Releases

In the following, we list DuckLake's past releases.

<!-- markdownlint-disable MD034 MD055 MD056 MD058 -->

{% assign latest_version_number = "0.0" %}

{% for row in site.data.past_releases %}
  {% if row.ducklake_extension > latest_version_number %}
    {% assign latest_version_number = row.ducklake_extension %}
  {% endif %}
{% endfor %}

| Release date | Spec. version | Extension version |
|-------------:|--------------:|------------------:|
{% for row in site.data.past_releases %}
  {%- if row.ducklake_extension == latest_version_number %}
    {% assign docs_version = "stable" %}
  {% else %}
    {% assign docs_version = row.ducklake_extension %}
  {% endif -%}
  | [{{ row.release_date }}]({{ row.release_notes }}) | [{{ row.ducklake_spec }}](/docs/{{ docs_version }}/specification/introduction) | [{{ row.ducklake_extension }}](/docs/{{ docs_version }}/duckdb/introduction) |
{% endfor %}

<!-- markdownlint-enable MD034 MD055 MD056 MD058 -->

## Compatibility Matrix

Currently, the DuckLake specification and the `ducklake` DuckDB extension are currently released together. This may not be the case in the future, where the specification and the extension may have different release cadences. It can also be the case that the extension needs a DuckDB core update, therefore DuckDB versions are also included in this compatibility matrix.

{% if site.data.compatibility_matrix.size > 0 %}
| DuckDB version | Extension version | Spec. version |
|------------------:|--------------------------------:|----------------------------------:|
{%- for release in site.data.compatibility_matrix %}
| {{ release.duckdb_version }} | {{ release.ducklake_extension_version }} | {{ release.ducklake_spec_version }} |
{%- endfor %}
{% else %}
_There is no compatibility matrix at the moment. Please check back later._
{% endif %}
