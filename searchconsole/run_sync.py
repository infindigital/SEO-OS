#!/usr/bin/env python3
"""Google Search Console sync CLI.

Pulls a site's search-performance snapshot and writes ``search-console.json``
(Clicks, Impressions, CTR, Position, Top Queries, Top Pages).

Usage:
    # Live sync (service-account credentials required):
    python searchconsole/run_sync.py "https://example.com/" \
        --credentials service-account.json --days 28 --out search-console.json

    # Offline sample snapshot (no credentials, deterministic):
    python searchconsole/run_sync.py "https://example.com/" --sample

The ``site`` argument is a Search Console property: a URL-prefix property
(``https://example.com/``) or a Domain property (``sc-domain:example.com``).

Setup for live runs (once):
    python -m venv searchconsole/.venv
    searchconsole/.venv/bin/pip install -r searchconsole/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sc_sync import (
    GoogleSearchConsoleClient,
    SampleSearchConsoleClient,
    build_report,
    default_range,
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_sync.py",
        description="Sync Google Search Console performance to search-console.json.",
    )
    parser.add_argument(
        "site",
        help="Search Console property, e.g. 'https://example.com/' or "
        "'sc-domain:example.com'.",
    )
    parser.add_argument(
        "--credentials",
        default=None,
        help="Path to a Google service-account JSON key (required unless --sample).",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Use the offline sample client (no credentials, deterministic output).",
    )
    parser.add_argument(
        "--start",
        default=None,
        help="Start date YYYY-MM-DD (overrides --days).",
    )
    parser.add_argument(
        "--end",
        default=None,
        help="End date YYYY-MM-DD (overrides --days).",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=28,
        help="Reporting window length in days when --start/--end are omitted "
        "(default: 28).",
    )
    parser.add_argument(
        "--lag",
        type=int,
        default=3,
        help="Days to skip at the end for unfinalized data (default: 3).",
    )
    parser.add_argument(
        "--row-limit",
        type=int,
        default=10,
        help="Number of Top Queries and Top Pages to keep (default: 10).",
    )
    parser.add_argument(
        "--out",
        default="search-console.json",
        help="Output file path (default: search-console.json).",
    )
    return parser.parse_args(argv)


def _resolve_range(args: argparse.Namespace) -> tuple[str, str]:
    if bool(args.start) != bool(args.end):
        raise ValueError("Provide both --start and --end, or neither.")
    if args.start and args.end:
        if args.start > args.end:
            raise ValueError("--start must not be after --end.")
        return args.start, args.end
    return default_range(days=args.days, lag=args.lag)


def _build_client(args: argparse.Namespace):
    if args.sample:
        return SampleSearchConsoleClient()
    if not args.credentials:
        raise ValueError(
            "Live sync requires --credentials <service-account.json> "
            "(or pass --sample for an offline snapshot)."
        )
    if not Path(args.credentials).exists():
        raise ValueError(f"Credentials file not found: {args.credentials}")
    return GoogleSearchConsoleClient(args.credentials)


def main(argv: list[str]) -> int:
    args = parse_args(argv)

    if args.days < 1:
        print("--days must be >= 1", file=sys.stderr)
        return 2
    if args.row_limit < 1:
        print("--row-limit must be >= 1", file=sys.stderr)
        return 2

    try:
        start_date, end_date = _resolve_range(args)
        client = _build_client(args)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    try:
        report = build_report(
            client,
            site=args.site,
            start_date=start_date,
            end_date=end_date,
            generated_at=generated_at,
            row_limit=args.row_limit,
        )
    except Exception as exc:  # noqa: BLE001 — surface API/auth failures to the CLI.
        print(f"Search Console sync failed: {exc}", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(report.to_dict(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    totals = report.totals
    print(
        f"Wrote {out_path} — {args.site} {start_date}..{end_date}: "
        f"{totals.clicks} clicks, {totals.impressions} impressions, "
        f"{len(report.top_queries)} top queries, {len(report.top_pages)} top pages.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
