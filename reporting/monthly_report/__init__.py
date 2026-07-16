"""Monthly client report generator.

Assembles the file-pipeline artifacts (GA4, Search Console, the technical
audit) plus completed work and a roadmap into a seven-section monthly report —
Executive Summary, SEO Progress, Completed Work, Traffic Growth, Keyword
Growth, Developer Progress, Next Month Roadmap — and exports it as Markdown and
PDF.

- :mod:`monthly_report.models`   — the report data shape (sections + deltas).
- :mod:`monthly_report.sources`  — inputs and loaders for the artifacts.
- :mod:`monthly_report.build`    — :func:`build_report`, which assembles it.
- :mod:`monthly_report.narrator` — pluggable Executive Summary (rule-based or
  Claude with fallback).
- :mod:`monthly_report.render`   — Markdown export.
- :mod:`monthly_report.pdf`      — PDF export (fpdf2, lazy import).

The CLI (``run_report.py``) writes ``report.md`` and ``report.pdf``.
"""

from .build import build_report
from .models import MonthlyReport
from .narrator import (
    ClaudeNarrator,
    Narrator,
    ReportFacts,
    RuleBasedNarrator,
    default_narrator,
)
from .pdf import render_pdf
from .render import render_markdown
from .sources import ReportInputs, load_json

__all__ = [
    "build_report",
    "MonthlyReport",
    "ReportInputs",
    "load_json",
    "render_markdown",
    "render_pdf",
    "Narrator",
    "ReportFacts",
    "RuleBasedNarrator",
    "ClaudeNarrator",
    "default_narrator",
]
