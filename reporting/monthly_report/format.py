"""Presentation helpers shared by the Markdown and PDF renderers.

Kept ASCII-only so the same strings render in Markdown and in a PDF built with
fpdf2's core (Latin-1) fonts.
"""

from __future__ import annotations

from .models import MetricDelta


def fmt_number(value) -> str:
    if isinstance(value, bool):  # guard: bool is an int subclass
        return str(value)
    if isinstance(value, int):
        return f"{value:,}"
    if isinstance(value, float):
        return f"{value:,.1f}".rstrip("0").rstrip(".") if value % 1 else f"{int(value):,}"
    return str(value)


def fmt_pct(pct: float | None) -> str:
    if pct is None:
        return ""
    sign = "+" if pct > 0 else ""
    return f"{sign}{pct}%"


def fmt_delta(delta: MetricDelta) -> str:
    """e.g. '1,200 (+12.0% vs 1,071)', '900 (new)', '500 (flat)'."""
    current = fmt_number(delta.current)
    if delta.direction == "new" or delta.previous is None:
        return f"{current} (new)"
    if delta.direction == "flat":
        return f"{current} (flat)"
    pct = fmt_pct(delta.pct)
    change = f"{pct} vs {fmt_number(delta.previous)}" if pct else f"vs {fmt_number(delta.previous)}"
    return f"{current} ({change})"
