#!/usr/bin/env python3
"""AI audit generator CLI.

Reads an ``audit.json`` and writes two Markdown deliverables:
``technical-audit.md`` and ``developer-tasks.md``.

The structured task fields are generated deterministically from a curated SEO
knowledge base. The executive summary is written by Claude when
``ANTHROPIC_API_KEY`` is set (see requirements.txt), and by a deterministic
fallback otherwise — so the generator always runs.

Usage:
    python generator/run_generate.py audit.json [--out-dir .]
      [--technical-audit technical-audit.md] [--developer-tasks developer-tasks.md]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from seo_audit_gen import build_audit, default_narrator
from seo_audit_gen.render import render_developer_tasks, render_technical_audit

# Make the sibling client-memory package importable so recommendations can be
# generated with the client's memory loaded (see --client).
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "memory"))
try:
    from client_memory import load_memory, record_audit, save_memory
except Exception:  # noqa: BLE001 — memory integration is optional.
    load_memory = None  # type: ignore[assignment]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_generate.py",
        description="Generate technical-audit.md and developer-tasks.md from audit.json.",
    )
    parser.add_argument("audit", help="Path to audit.json")
    parser.add_argument(
        "--out-dir", default=".", help="Directory for the output files (default: .)."
    )
    parser.add_argument(
        "--technical-audit",
        default="technical-audit.md",
        help="Technical audit filename (default: technical-audit.md).",
    )
    parser.add_argument(
        "--developer-tasks",
        default="developer-tasks.md",
        help="Developer tasks filename (default: developer-tasks.md).",
    )
    parser.add_argument(
        "--client",
        default=None,
        help="Client id — loads clients/<id>/memory.md before recommending.",
    )
    parser.add_argument(
        "--record-audit",
        action="store_true",
        help="Append this audit to the client's Previous Audits (needs --client).",
    )
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])

    audit_path = Path(args.audit)
    try:
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"Error: input file not found: {audit_path}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"Error: {audit_path} is not valid JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(audit, dict) or "categories" not in audit:
        print(
            f"Error: {audit_path} does not look like an audit.json (missing 'categories').",
            file=sys.stderr,
        )
        return 1

    memory = None
    if args.client:
        if load_memory is None:
            print(
                "Warning: client memory package unavailable; continuing without memory.",
                file=sys.stderr,
            )
        else:
            memory = load_memory(args.client)
            state = "empty" if memory.is_empty() else "loaded"
            print(f"Client memory for {args.client}: {state}.", file=sys.stderr)

    narrator = default_narrator()
    print(f"Using {type(narrator).__name__} for the executive summary.", file=sys.stderr)

    # Memory is loaded before recommendations are generated.
    generated = build_audit(audit, narrator, memory=memory)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    technical_path = out_dir / args.technical_audit
    tasks_path = out_dir / args.developer_tasks

    technical_path.write_text(render_technical_audit(generated), encoding="utf-8")
    tasks_path.write_text(render_developer_tasks(generated), encoding="utf-8")

    print(
        f"Generated {len(generated.tasks)} task(s); "
        f"estimated effort {generated.total_minutes} min.",
        file=sys.stderr,
    )
    print(f"Saved {technical_path}", file=sys.stderr)
    print(f"Saved {tasks_path}", file=sys.stderr)

    if args.record_audit and memory is not None:
        totals = generated.totals
        by_severity = totals.get("bySeverity", {}) or {}
        date = generated.generated_at or audit.get("generatedAt")
        summary_line = (
            f"{totals.get('totalIssues', 0)} issue(s) across "
            f"{totals.get('totalPages', 0)} page(s) "
            f"({by_severity.get('error', 0)} error); "
            f"{len(generated.tasks)} task(s) generated."
        )
        record_audit(memory, summary_line, date=date)
        save_memory(memory)
        print(f"Recorded audit in memory for {args.client}.", file=sys.stderr)
    elif args.record_audit:
        print("Warning: --record-audit needs --client; skipped.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
