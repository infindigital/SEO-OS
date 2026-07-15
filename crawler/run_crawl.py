#!/usr/bin/env python3
"""SEO crawler CLI (Version 1) — Crawl4AI + Playwright.

Crawls a website and writes the result to ``crawl.json``. No analysis is
performed.

Usage:
    python crawler/run_crawl.py <url> [--max-pages N] [--max-depth N] [--out PATH]

Setup (once):
    python -m venv crawler/.venv
    crawler/.venv/bin/pip install -r crawler/requirements.txt
    crawler/.venv/bin/playwright install chromium

Run with the venv interpreter, e.g.:
    crawler/.venv/bin/python crawler/run_crawl.py https://example.com
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from seo_crawler import CrawlOptions, SeoCrawler


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_crawl.py",
        description="Crawl a website and save per-page SEO data as crawl.json.",
    )
    parser.add_argument("url", help="Start URL, e.g. https://example.com")
    parser.add_argument(
        "--max-pages",
        type=int,
        default=50,
        help="Maximum number of pages to crawl (default: 50).",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=2,
        help="Maximum link depth from the start URL (default: 2).",
    )
    parser.add_argument(
        "--out",
        default="crawl.json",
        help="Output file path (default: crawl.json).",
    )
    return parser.parse_args(argv)


async def run(args: argparse.Namespace) -> int:
    if args.max_pages < 1 or args.max_depth < 0:
        print("--max-pages must be >= 1 and --max-depth must be >= 0", file=sys.stderr)
        return 2

    options = CrawlOptions(max_pages=args.max_pages, max_depth=args.max_depth)
    crawler = SeoCrawler()

    print(
        f"Crawling {args.url} (max {options.max_pages} pages, depth {options.max_depth})…",
        file=sys.stderr,
    )
    try:
        result = await crawler.crawl(args.url, options)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    if out_path.parent and not out_path.parent.exists():
        out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(result.to_dict(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(
        f"Done. Crawled {result.page_count} page(s) in {result.duration_ms}ms.",
        file=sys.stderr,
    )
    print(f"Saved {out_path}", file=sys.stderr)
    return 0


def main() -> None:
    args = parse_args(sys.argv[1:])
    raise SystemExit(asyncio.run(run(args)))


if __name__ == "__main__":
    main()
