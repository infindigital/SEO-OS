#!/usr/bin/env python3
"""Monthly report generator CLI.

Reads a report config (which references the file-pipeline artifacts) and writes
a seven-section monthly client report as Markdown and/or PDF.

Usage:
    python reporting/run_report.py config.json --md report.md --pdf report.pdf

    # Use the bundled sample config for a quick end-to-end run:
    python reporting/run_report.py --sample --md report.md --pdf report.pdf

Config shape (paths relative to the config's directory unless --base is given):
    {
      "client": "Acme",
      "website": "https://acme.com/",
      "period": "July 2026",
      "seoScore": 78, "seoScorePrevious": 71,
      "ga4": "ga4.json", "ga4Previous": "ga4-prev.json",
      "searchConsole": "search-console.json",
      "searchConsolePrevious": "search-console-prev.json",
      "audit": "audit.json", "auditPrevious": "audit-prev.json",
      "openTasks": 4,
      "completedWork": [{"title": "Fixed 404s", "detail": "12 pages", "completedAt": "2026-07-10"}],
      "roadmap": [{"title": "Improve Core Web Vitals", "detail": "LCP < 2.5s"}]
    }

The Executive Summary is written by Claude when ``ANTHROPIC_API_KEY`` is set,
and by a deterministic fallback otherwise — so the report always generates.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from monthly_report import (
    ReportInputs,
    build_report,
    default_narrator,
    load_json,
    render_markdown,
    render_pdf,
)

SAMPLE_CONFIG = Path(__file__).resolve().parent / "sample" / "report-config.json"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_report.py",
        description="Generate a monthly client report (Markdown + PDF).",
    )
    parser.add_argument(
        "config",
        nargs="?",
        default=None,
        help="Path to the report config JSON (omit with --sample).",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Use the bundled sample config (reporting/sample/report-config.json).",
    )
    parser.add_argument(
        "--base",
        default=None,
        help="Base directory for artifact paths (default: the config's directory).",
    )
    parser.add_argument("--md", default="report.md", help="Markdown output path (default: report.md).")
    parser.add_argument(
        "--pdf",
        default="report.pdf",
        help="PDF output path (default: report.pdf). Pass --no-pdf to skip.",
    )
    parser.add_argument("--no-pdf", action="store_true", help="Skip PDF export.")
    parser.add_argument("--no-md", action="store_true", help="Skip Markdown export.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)

    config_path = SAMPLE_CONFIG if args.sample else (Path(args.config) if args.config else None)
    if config_path is None:
        print("Error: provide a config path or --sample.", file=sys.stderr)
        return 2
    if not config_path.exists():
        print(f"Error: config not found: {config_path}", file=sys.stderr)
        return 2

    try:
        config = load_json(config_path)
    except (json.JSONDecodeError, ValueError) as exc:
        print(f"Error: invalid config {config_path}: {exc}", file=sys.stderr)
        return 2

    base_dir = args.base or str(config_path.parent)
    try:
        inputs = ReportInputs.from_config(config, base_dir=base_dir)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Error loading report inputs: {exc}", file=sys.stderr)
        return 2

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    report = build_report(inputs, generated_at=generated_at, narrator=default_narrator())

    wrote: list[str] = []
    if not args.no_md:
        md_path = Path(args.md)
        md_path.parent.mkdir(parents=True, exist_ok=True)
        md_path.write_text(render_markdown(report), encoding="utf-8")
        wrote.append(str(md_path))

    if not args.no_pdf:
        try:
            pdf_bytes = render_pdf(report)
        except RuntimeError as exc:
            print(f"PDF export failed: {exc}", file=sys.stderr)
            return 1
        pdf_path = Path(args.pdf)
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        pdf_path.write_bytes(pdf_bytes)
        wrote.append(str(pdf_path))

    if not wrote:
        print("Nothing to write (both --no-md and --no-pdf given).", file=sys.stderr)
        return 2

    print(
        f"Wrote {', '.join(wrote)} — {report.meta.client} "
        f"{report.meta.period or '(no period)'}.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
