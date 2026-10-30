#!/usr/bin/env python3
"""
Automated documentation updater for DuckLake.

Reads open issues in duckdb/ducklake-web that reference merged PRs in
duckdb/ducklake, gathers context from those PRs, and invokes Claude Code
to update the local docs accordingly.

Usage:
    python scripts/update_docs.py 277              # single issue
    python scripts/update_docs.py 277,286,275      # multiple issues
    python scripts/update_docs.py --full-batch      # all matching open issues
    python scripts/update_docs.py 277 --dry-run     # print prompt only
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

DUCKLAKE_WEB_REPO = "duckdb/ducklake-web"
DUCKLAKE_REPO = "duckdb/ducklake"
DEFAULT_MODEL = "sonnet"
DEFAULT_DOCS_VERSION = "preview"
VALID_DOCS_VERSIONS = ("preview", "stable")

# File extensions to keep from the PR diff
DIFF_KEEP_EXTENSIONS = {".cpp", ".hpp", ".h"}
# Prioritize headers when truncating
DIFF_PRIORITY_EXTENSIONS = {".hpp", ".h"}
# Maximum characters for diff in the prompt
MAX_DIFF_CHARS = 50_000


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------


@dataclass
class IssueResult:
    issue_num: int
    ducklake_pr: int | None = None
    pr_title: str = ""
    status: str = "PENDING"  # DONE, SKIPPED, ERROR
    reason: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def run_gh(*args: str, repo: str | None = None) -> dict | list | None:
    """Run a gh command expecting JSON output. Returns parsed JSON or None."""
    cmd = ["gh", *args]
    if repo:
        cmd.extend(["--repo", repo])
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  gh error: {result.stderr.strip()}", file=sys.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"  gh returned invalid JSON: {result.stdout[:200]}", file=sys.stderr)
        return None


def run_gh_text(*args: str, repo: str | None = None) -> str | None:
    """Run a gh command expecting plain text output. Returns stdout or None."""
    cmd = ["gh", *args]
    if repo:
        cmd.extend(["--repo", repo])
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  gh error: {result.stderr.strip()}", file=sys.stderr)
        return None
    return result.stdout


def find_repo_root() -> Path:
    """Find the git repository root."""
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("Error: not inside a git repository.", file=sys.stderr)
        sys.exit(1)
    return Path(result.stdout.strip())


def extract_ducklake_pr(title: str, body: str) -> int | None:
    """Extract ducklake PR number from issue title or body."""
    # Try title first: [ducklake/#NNN]
    m = re.search(r"\[ducklake/#(\d+)\]", title)
    if m:
        return int(m.group(1))
    # Fallback: URL in body
    m = re.search(r"github\.com/duckdb/ducklake/pull/(\d+)", body or "")
    if m:
        return int(m.group(1))
    return None


# ---------------------------------------------------------------------------
# Diff filtering
# ---------------------------------------------------------------------------


def filter_diff(raw_diff: str) -> str:
    """Keep only src/**/*.{cpp,hpp,h} hunks, excluding test/CI files."""
    chunks: list[tuple[str, str]] = []  # (filename, chunk_text)
    current_file: str | None = None
    current_lines: list[str] = []

    for line in raw_diff.splitlines(keepends=True):
        if line.startswith("diff --git"):
            # Save previous chunk
            if current_file and current_lines:
                chunks.append((current_file, "".join(current_lines)))
            # Parse filename from "diff --git a/path b/path"
            parts = line.split()
            current_file = parts[-1].lstrip("b/") if len(parts) >= 4 else None
            current_lines = [line]
        else:
            current_lines.append(line)

    # Don't forget last chunk
    if current_file and current_lines:
        chunks.append((current_file, "".join(current_lines)))

    # Filter chunks
    def keep(filename: str) -> bool:
        if not filename.startswith("src/"):
            return False
        ext = Path(filename).suffix
        if ext not in DIFF_KEEP_EXTENSIONS:
            return False
        # Exclude test/CI paths
        lower = filename.lower()
        if "/test" in lower or "/ci" in lower or "/benchmark" in lower:
            return False
        return True

    kept = [(f, text) for f, text in chunks if keep(f)]

    if not kept:
        return ""

    # Prioritize .hpp/.h files if we need to truncate
    total = sum(len(t) for _, t in kept)
    if total <= MAX_DIFF_CHARS:
        return "".join(t for _, t in kept)

    priority = [(f, t) for f, t in kept if Path(f).suffix in DIFF_PRIORITY_EXTENSIONS]
    rest = [(f, t) for f, t in kept if Path(f).suffix not in DIFF_PRIORITY_EXTENSIONS]

    result_parts: list[str] = []
    remaining = MAX_DIFF_CHARS

    for _, text in priority:
        if remaining <= 0:
            break
        result_parts.append(text[:remaining])
        remaining -= len(text)

    for _, text in rest:
        if remaining <= 0:
            break
        result_parts.append(text[:remaining])
        remaining -= len(text)

    return "".join(result_parts)


# ---------------------------------------------------------------------------
# Prompt building
# ---------------------------------------------------------------------------


def build_style_guide(docs_version: str) -> str:
    return f"""\
## Documentation Style Guide (from CONTRIBUTING.md)

- Use GitHub Markdown. Do not hard-wrap lines.
- Format code blocks with appropriate language tags (```sql, ```python, etc.).
- Use `batch` for shell commands with $ prompt, `bash` for no prompt.
- Use `text` for output, `console` for error messages.
- Quoted blocks (> Note, > Warning, > Tip, > Bestpractice, > Deprecated) render as colored boxes.
- Always format SQL keywords, variable names, function names as inline code.
- SQL style: 4-space indent, UPPERCASE keywords, lowercase functions, snake_case names.
- End SQL statements with semicolons.
- Use American English spelling. Use the Oxford comma.
- Do not prefix DuckDB and DuckLake version numbers with `v` (write "DuckDB 1.5.2", not "DuckDB v1.5.2").
- Page title goes in front matter `title` property, not repeated as h1.
- Use h2 (##), h3 (###), h4 (####) only. Headline capitalization (Chicago style).
- Use Jekyll {{% link docs/{docs_version}/path.md %}} for cross-references.
- New pages need a corresponding entry in _data/menu_docs_{docs_version}.json.
- File names use snake_case.
- Examples should be self-contained and reproducible where possible.
"""


def build_prompt(
    pr_title: str,
    pr_body: str,
    pr_number: int,
    filtered_diff: str,
    issue_num: int,
    docs_version: str = DEFAULT_DOCS_VERSION,
) -> str:
    """Build the prompt for Claude Code."""
    parts = [
        f"# Task: Update DuckLake Documentation for PR #{pr_number}\n",
        f"## Issue\n\nduckdb/ducklake-web#{issue_num}\n",
        f"## PR Description\n\n**{pr_title}**\n\n{pr_body}\n",
    ]

    if filtered_diff:
        if len(filtered_diff) >= MAX_DIFF_CHARS:
            parts.append(
                f"\n## Source Code Changes (truncated to {MAX_DIFF_CHARS} chars)\n\n"
            )
        else:
            parts.append("\n## Source Code Changes\n\n")
        parts.append(f"```diff\n{filtered_diff}\n```\n")
    else:
        parts.append(
            "\n## Source Code Changes\n\nNo source file changes found "
            "(this may be a test-only or CI-only PR).\n"
        )

    parts.append(f"\n{build_style_guide(docs_version)}\n")

    parts.append(f"""\
## Instructions

You are updating the DuckLake documentation based on the PR described above.
All changes must go in `docs/{docs_version}/`, NOT in any other docs version directory.

1. Use Glob/Read/Grep to explore the existing docs in `docs/{docs_version}/` and understand
   the current documentation structure and content.
2. Read `_data/menu_docs_{docs_version}.json` to understand the navigation structure.
3. For each aspect of the PR, check whether it is already documented:
   - If it is already documented and the behaviour is unchanged, make no edits to that part.
   - If it is already documented but the PR changes the behaviour, update only what changed
     (e.g., rename an option, adjust a default value, add a clarification).
   - If it is not yet documented, add it following the guidelines below.
4. Based on the PR description and code changes above, determine what documentation
   changes are needed. This could be:
   - Updating existing pages with new features, parameters, or behavior changes
   - Adding new documentation pages for entirely new features
   - Updating configuration/settings documentation
   - Adding or updating SQL examples
5. Make the documentation changes:
   - Edit existing files where the feature extends or changes current functionality
   - Create new files only if the feature warrants a dedicated page
   - If creating a new page, also update `_data/menu_docs_{docs_version}.json`
6. Ensure all changes follow the style guide above.
7. Use `{{% link docs/{docs_version}/path.md %}}` for any cross-references to other doc pages.

Focus on accuracy and minimal diff. Only document what the PR actually implements — do not
speculate about features not shown in the PR description or code changes. Prefer targeted
edits over rewrites of sections that are already correct.

When writing or extending SQL examples:
- Read the existing examples in the file you are editing before writing new ones.
- Reuse the same `ATTACH` statement syntax already present in the file. For example, if the
  file uses `ATTACH 'ducklake:inlining.duckdb' AS my_ducklake`, do not introduce a different
  connection string or alias such as `ATTACH 'ducklake:metadata.duckdb' AS ducklake`.
- Reuse table and schema definitions already established in the file. Many pages are written
  as a continuous SQL flow (e.g., `upserting.md`) where later examples build on tables
  created earlier. New examples should fit into that flow rather than redefining tables.
- Only introduce new table or schema definitions when the example genuinely requires data
  that does not exist yet in the file.

If the PR changes are purely internal (refactoring, test improvements) with no
user-facing impact, state that no documentation changes are needed and make no edits.
""")

    return "".join(parts)


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------


def log(issue_num: int, msg: str) -> None:
    """Print a step-level log line for the given issue."""
    print(f"  [#{issue_num}] {msg}")


def process_issue(
    issue_num: int,
    repo_root: Path,
    dry_run: bool = False,
    model: str = DEFAULT_MODEL,
    docs_version: str = DEFAULT_DOCS_VERSION,
) -> IssueResult:
    """Process a single issue: fetch context, build prompt, invoke Claude."""
    result = IssueResult(issue_num=issue_num)
    print(f"\n--- Processing issue #{issue_num} ---")

    # 1. Fetch issue
    log(issue_num, "Fetching issue from ducklake-web...")
    issue = run_gh(
        "issue",
        "view",
        str(issue_num),
        "--json",
        "title,body",
        repo=DUCKLAKE_WEB_REPO,
    )
    if issue is None:
        result.status = "ERROR"
        result.reason = "failed to fetch issue"
        return result

    title = issue.get("title", "")
    body = issue.get("body", "")
    log(issue_num, f"Issue title: {title}")

    # 2. Extract PR number
    log(issue_num, "Extracting ducklake PR number...")
    pr_num = extract_ducklake_pr(title, body)
    if pr_num is None:
        log(issue_num, "No ducklake PR reference found in title or body.")
        result.status = "SKIPPED"
        result.reason = "no ducklake PR found"
        return result

    result.ducklake_pr = pr_num
    log(issue_num, f"Linked to ducklake/#{pr_num}")

    # 3. Fetch PR context
    log(issue_num, f"Fetching PR #{pr_num} from ducklake...")
    pr_data = run_gh(
        "pr",
        "view",
        str(pr_num),
        "--json",
        "title,body,state,files",
        repo=DUCKLAKE_REPO,
    )
    if pr_data is None:
        result.status = "ERROR"
        result.reason = "failed to fetch PR"
        return result

    pr_title = pr_data.get("title", "")
    pr_body = pr_data.get("body", "")
    pr_state = pr_data.get("state", "")
    pr_files = pr_data.get("files", [])
    result.pr_title = pr_title
    log(issue_num, f"PR title: {pr_title}")
    log(issue_num, f"PR state: {pr_state} | files changed: {len(pr_files)}")

    if pr_state != "MERGED":
        log(issue_num, f"WARNING: PR is {pr_state}, not MERGED")

    # 4. Fetch & filter diff
    log(issue_num, f"Fetching diff for PR #{pr_num}...")
    raw_diff = run_gh_text("pr", "diff", str(pr_num), repo=DUCKLAKE_REPO)
    if raw_diff is None:
        result.status = "ERROR"
        result.reason = "gh pr diff failed"
        return result

    log(issue_num, f"Raw diff size: {len(raw_diff)} chars")
    log(
        issue_num, "Filtering diff (keeping src/**/*.{{cpp,hpp,h}}, excluding tests)..."
    )
    filtered_diff = filter_diff(raw_diff)

    if not filtered_diff:
        log(issue_num, "WARNING: No source files after filtering (test/CI-only PR?)")
    else:
        log(issue_num, f"Filtered diff size: {len(filtered_diff)} chars")
        if len(filtered_diff) >= MAX_DIFF_CHARS:
            log(issue_num, f"Diff truncated to {MAX_DIFF_CHARS} chars")

    # 5. Build prompt
    log(issue_num, "Building prompt...")
    prompt = build_prompt(
        pr_title, pr_body, pr_num, filtered_diff, issue_num, docs_version
    )
    log(issue_num, f"Prompt size: {len(prompt)} chars")

    # 6. Invoke Claude (or dry-run)
    if dry_run:
        print(f"\n{'='*72}")
        print(f"DRY RUN — Prompt for issue #{issue_num} (ducklake/#{pr_num}):")
        print(f"{'='*72}")
        print(prompt)
        print(f"{'='*72}\n")
        result.status = "DONE"
        result.reason = "dry run"
        return result

    log(issue_num, f"Invoking Claude (model: {model})...")
    claude_cmd = [
        "claude",
        "--print",
        "--dangerously-skip-permissions",
        "--output-format",
        "json",
    ]
    if model != DEFAULT_MODEL:
        claude_cmd.extend(["--model", model])
    claude_cmd.append(prompt)

    try:
        proc = subprocess.run(
            claude_cmd,
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            timeout=300,
        )
        if proc.returncode != 0:
            result.status = "ERROR"
            result.reason = f"claude exited with code {proc.returncode}"
            if proc.stderr:
                log(issue_num, f"Claude stderr: {proc.stderr[:500]}")
            return result
    except FileNotFoundError:
        result.status = "ERROR"
        result.reason = "claude CLI not found"
        return result
    except subprocess.TimeoutExpired:
        result.status = "ERROR"
        result.reason = "claude timed out (300s)"
        return result

    # Parse token usage from JSON output
    try:
        output = json.loads(proc.stdout)
        usage = output.get("usage", {})
        result.input_tokens = usage.get("input_tokens", 0)
        result.output_tokens = usage.get("output_tokens", 0)
        result.cache_read_tokens = usage.get("cache_read_input_tokens", 0)
        result.cache_write_tokens = usage.get("cache_creation_input_tokens", 0)
        total = result.input_tokens + result.output_tokens
        cache_info = ""
        if result.cache_read_tokens or result.cache_write_tokens:
            cache_info = (
                f" (cache: {result.cache_read_tokens} read"
                f" / {result.cache_write_tokens} write)"
            )
        log(
            issue_num,
            f"Tokens — input: {result.input_tokens:,}"
            f" | output: {result.output_tokens:,}"
            f" | total: {total:,}{cache_info}",
        )
    except (json.JSONDecodeError, AttributeError):
        log(issue_num, "WARNING: could not parse token usage from Claude output")

    log(issue_num, "Claude finished successfully.")
    result.status = "DONE"
    return result


# ---------------------------------------------------------------------------
# Issue resolution
# ---------------------------------------------------------------------------


def fetch_all_ducklake_issues() -> list[int]:
    """Fetch all open issues matching [ducklake/#NNN] pattern."""
    data = run_gh(
        "issue",
        "list",
        "--search",
        "ducklake/#",
        "--state",
        "open",
        "--limit",
        "100",
        "--json",
        "number,title",
        repo=DUCKLAKE_WEB_REPO,
    )
    if data is None:
        print("Error: failed to fetch issues list.", file=sys.stderr)
        sys.exit(1)

    return sorted(
        i["number"] for i in data if re.search(r"\[ducklake/#\d+\]", i.get("title", ""))
    )


def resolve_issues(args: argparse.Namespace) -> list[int]:
    """Resolve the list of issue numbers from CLI arguments."""
    if args.full_batch:
        issues = fetch_all_ducklake_issues()
        if not issues:
            print("No matching open issues found.", file=sys.stderr)
            sys.exit(0)
        print(
            f"Found {len(issues)} matching issues: {', '.join(f'#{n}' for n in issues)}\n"
        )
        return issues

    if not args.issues:
        print("Error: provide issue numbers or use --full-batch.", file=sys.stderr)
        sys.exit(1)

    nums: list[int] = []
    for part in args.issues.split(","):
        part = part.strip()
        if not part.isdigit():
            print(f"Error: invalid issue number '{part}'.", file=sys.stderr)
            sys.exit(1)
        nums.append(int(part))
    return nums


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def print_result(r: IssueResult) -> None:
    pr_part = f"ducklake/#{r.ducklake_pr}" if r.ducklake_pr else "no PR"
    title_part = f" - {r.pr_title}" if r.pr_title else ""
    reason_part = f" ({r.reason})" if r.reason and r.status != "DONE" else ""
    print(f"[#{r.issue_num}] {pr_part}{title_part} - {r.status}{reason_part}")


def print_summary(results: list[IssueResult]) -> None:
    done = sum(1 for r in results if r.status == "DONE")
    skipped = sum(1 for r in results if r.status == "SKIPPED")
    errors = sum(1 for r in results if r.status == "ERROR")
    total = len(results)

    total_input = sum(r.input_tokens for r in results)
    total_output = sum(r.output_tokens for r in results)
    total_cache_read = sum(r.cache_read_tokens for r in results)
    total_cache_write = sum(r.cache_write_tokens for r in results)

    print(f"\n{'='*20}")
    print(f"=== Summary ===")
    print(f"Processed: {total}")
    print(f"  DONE:    {done}")
    print(f"  SKIPPED: {skipped}")
    print(f"  ERROR:   {errors}")
    if total_input or total_output:
        print(f"Tokens:")
        print(f"  Input:       {total_input:>10,}")
        print(f"  Output:      {total_output:>10,}")
        print(f"  Total:       {total_input + total_output:>10,}")
        if total_cache_read or total_cache_write:
            print(f"  Cache read:  {total_cache_read:>10,}")
            print(f"  Cache write: {total_cache_write:>10,}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def validate_prerequisites() -> None:
    """Check that required tools are available."""
    for tool in ("gh", "claude"):
        if shutil.which(tool) is None:
            print(f"Error: '{tool}' not found in PATH.", file=sys.stderr)
            sys.exit(1)

    # Check we're in a git repo
    result = subprocess.run(
        ["git", "rev-parse", "--is-inside-work-tree"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("Error: not inside a git repository.", file=sys.stderr)
        sys.exit(1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update DuckLake docs from linked GitHub issues/PRs.",
    )
    parser.add_argument(
        "issues",
        nargs="?",
        help="Comma-separated issue numbers (e.g., 277 or 277,286,275)",
    )
    parser.add_argument(
        "--full-batch",
        action="store_true",
        help="Process all open issues with [ducklake/#NNN] pattern",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the prompt instead of invoking Claude",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Claude model to use (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--docs-version",
        default=DEFAULT_DOCS_VERSION,
        choices=VALID_DOCS_VERSIONS,
        help=f"Docs version to update (default: {DEFAULT_DOCS_VERSION})",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    validate_prerequisites()
    repo_root = find_repo_root()
    issues = resolve_issues(args)
    print(f"Model: {args.model} | Docs version: {args.docs_version}")

    results: list[IssueResult] = []
    for issue_num in issues:
        result = process_issue(
            issue_num,
            repo_root,
            dry_run=args.dry_run,
            model=args.model,
            docs_version=args.docs_version,
        )
        results.append(result)
        print_result(result)

    print_summary(results)


if __name__ == "__main__":
    main()
