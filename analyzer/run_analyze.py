#!/usr/bin/env python3
"""Technical SEO analyzer CLI.

Reads a ``crawl.json`` and writes a technical SEO audit to ``audit.json``.
Pure stdlib — no third-party dependencies or browser required.

Usage:
    python analyzer/run_analyze.py crawl.json [--out audit.json]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from seo_analyzer import analyze_crawl


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_analyze.py",
        description="Analyze a crawl.json and save a technical SEO audit as audit.json.",
    )
    parser.add_argument("crawl", help="Path to crawl.json")
    parser.add_argument(
        "--out",
        default="audit.json",
        help="Output file path (default: audit.json).",
    )
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])

    crawl_path = Path(args.crawl)
    try:
        crawl = json.loads(crawl_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"Error: input file not found: {crawl_path}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"Error: {crawl_path} is not valid JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(crawl, dict) or "pages" not in crawl:
        print(
            f"Error: {crawl_path} does not look like a crawl.json (missing 'pages').",
            file=sys.stderr,
        )
        return 1

    audit = analyze_crawl(crawl)

    out_path = Path(args.out)
    if out_path.parent and not out_path.parent.exists():
        out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    summary = audit["summary"]
    print(
        f"Analyzed {summary['totalPages']} page(s): "
        f"{summary['totalIssues']} issue(s) "
        f"({summary['bySeverity']['error']} error, "
        f"{summary['bySeverity']['warning']} warning, "
        f"{summary['bySeverity']['notice']} notice).",
        file=sys.stderr,
    )
    print(f"Saved {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
