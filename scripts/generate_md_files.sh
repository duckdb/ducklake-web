#!/usr/bin/env bash

set -xeuo pipefail

# navigate to the repository root
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/.."

# Generate single-file documentation
cd single-file-document
python3 concatenate_to_single_file.py
./clean_markdown_file.sh
sed -i '1s/^.*$/# DuckLake Documentation/' ducklake-docs-cleaned.md
cp ducklake-docs-cleaned.md ../ducklake-docs.md
cd ..

shopt -s extglob
rm -rf docs/!(stable)
find . -name '*.md' | xargs -I {} sed -E -i 's|\{% link ([^\}]*) %\}|https://ducklake.select/\1|g' {}
find . -name '*.md' | xargs -I {} sed -E -i 's|\{% post_url ([^\}]*) %\}|https://ducklake.select/\1.md|g' {}
cp *.md _site/
cp -r docs/stable _site/docs
cp -r _posts/* _site/
