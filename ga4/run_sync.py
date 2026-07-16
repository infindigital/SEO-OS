#!/usr/bin/env python3
"""Google Analytics 4 sync CLI.

Pulls a GA4 property's traffic snapshot and writes ``ga4.json`` (Users,
Sessions, Conversions, Top Pages, Events).

Usage:
    # Live sync (service-account credentials required):
    python ga4/run_sync.py 123456789 \
        --credentials service-account.json --days 28 --out ga4.json

    # Offline sample snapshot (no credentials, deterministic):
    python ga4/run_sync.py 123456789 --sample

The ``property`` argument is a GA4 property id (``123456789`` or
``properties/123456789``).

Setup for live runs (once):
    python -m venv ga4/.venv
    ga4/.venv/bin/pip install -r ga4/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from ga4_sync import (
    GoogleAnalyticsClient,
    SampleAnalyticsClient,
    build_report,
    default_range,
    normalize_property,
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_sync.py",
        description="Sync Google Analytics 4 traffic to ga4.json.",
    )
    parser.add_argument(
        "property",
        help="GA4 property id, e.g. '123456789' or 'properties/123456789'.",
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
        default=1,
        help="Days to skip at the end (default: 1, i.e. ends yesterday).",
    )
    parser.add_argument(
        "--row-limit",
        type=int,
        default=10,
        help="Number of Top Pages and Events to keep (default: 10).",
    )
    parser.add_argument(
        "--out",
        default="ga4.json",
        help="Output file path (default: ga4.json).",
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
        return SampleAnalyticsClient()
    if not args.credentials:
        raise ValueError(
            "Live sync requires --credentials <service-account.json> "
            "(or pass --sample for an offline snapshot)."
        )
    if not Path(args.credentials).exists():
        raise ValueError(f"Credentials file not found: {args.credentials}")
    return GoogleAnalyticsClient(args.credentials)


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
            property=normalize_property(args.property),
            start_date=start_date,
            end_date=end_date,
            generated_at=generated_at,
            row_limit=args.row_limit,
        )
    except Exception as exc:  # noqa: BLE001 — surface API/auth failures to the CLI.
        print(f"GA4 sync failed: {exc}", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(report.to_dict(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    totals = report.totals
    print(
        f"Wrote {out_path} — {report.property} {start_date}..{end_date}: "
        f"{totals.users} users, {totals.sessions} sessions, "
        f"{totals.conversions} conversions, {len(report.top_pages)} top pages, "
        f"{len(report.events)} events.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
