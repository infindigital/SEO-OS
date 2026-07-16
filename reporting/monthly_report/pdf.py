"""Render a :class:`MonthlyReport` to a PDF document.

Uses ``fpdf2`` (pure Python, no system dependencies), imported lazily so the
package and its non-PDF tests run without it installed. The layout mirrors the
Markdown renderer's seven sections. Text is coerced to Latin-1 (fpdf2's core
font encoding) so any stray non-Latin-1 character degrades gracefully instead
of raising.
"""

from __future__ import annotations

from .format import fmt_delta, fmt_number
from .models import MonthlyReport

_FONT = "Helvetica"


def _safe(text: str) -> str:
    """Coerce to Latin-1, replacing unsupported characters (core-font safe)."""
    return str(text).encode("latin-1", "replace").decode("latin-1")


class _Doc:
    """Thin fpdf2 wrapper whose cells always return to the left margin.

    multi_cell's defaults leave the cursor at the right edge, which starves the
    next cell of horizontal space; every write here pins ``new_x`` back to the
    left margin.
    """

    def __init__(self):
        from fpdf import FPDF
        from fpdf.enums import XPos, YPos

        self._x = XPos.LMARGIN
        self._y = YPos.NEXT
        self.pdf = FPDF()
        self.pdf.set_auto_page_break(auto=True, margin=15)
        self.pdf.add_page()

    def _write(self, height: float, text: str) -> None:
        self.pdf.multi_cell(0, height, text=_safe(text), new_x=self._x, new_y=self._y)

    def heading(self, text: str) -> None:
        self.pdf.set_font(_FONT, "B", 18)
        self.pdf.set_text_color(0, 0, 0)
        self._write(9, text)

    def muted(self, text: str) -> None:
        self.pdf.set_font(_FONT, "I", 10)
        self.pdf.set_text_color(110, 110, 110)
        self._write(5, text)
        self.pdf.set_text_color(0, 0, 0)

    def section(self, text: str) -> None:
        self.pdf.ln(2)
        self.pdf.set_font(_FONT, "B", 13)
        self._write(7, text)
        self.pdf.ln(1)

    def paragraph(self, text: str) -> None:
        self.pdf.set_font(_FONT, "", 11)
        self._write(5.5, text)
        self.pdf.ln(1)

    def bullet(self, text: str) -> None:
        self.pdf.set_font(_FONT, "", 11)
        self._write(5.5, f"- {text}")

    def gap(self, height: float = 3) -> None:
        self.pdf.ln(height)

    def output(self) -> bytes:
        return bytes(self.pdf.output())


def render_pdf(report: MonthlyReport) -> bytes:
    try:
        doc = _Doc()
    except ImportError as exc:  # pragma: no cover - depends on optional dep.
        raise RuntimeError(
            "PDF export requires 'fpdf2'. Install it with "
            "'pip install -r reporting/requirements.txt', or export Markdown "
            "with --md only."
        ) from exc

    doc.pdf.set_title(_safe(f"SEO Monthly Report - {report.meta.client}"))

    doc.heading(f"SEO Monthly Report - {report.meta.client}")
    meta_bits = [b for b in (report.meta.period, report.meta.website) if b]
    if meta_bits:
        doc.muted(" | ".join(meta_bits))
    if report.meta.generated_at:
        doc.muted(f"Generated {report.meta.generated_at}")
    doc.gap()

    # 1. Executive Summary
    doc.section("Executive Summary")
    doc.paragraph(report.executive_summary)

    # 2. SEO Progress
    seo = report.seo_progress
    doc.section("SEO Progress")
    if seo.score is not None:
        doc.bullet(f"SEO score: {fmt_delta(seo.score)}")
    doc.bullet(f"Issues resolved: {seo.issues_resolved}")
    doc.bullet(f"New issues: {seo.issues_new}")
    doc.bullet(f"Issues remaining: {seo.issues_remaining}")
    if seo.effort_remaining:
        doc.bullet(f"Estimated remediation effort: {seo.effort_remaining}")

    # 3. Completed Work
    doc.section("Completed Work")
    if report.completed_work:
        for item in report.completed_work:
            suffix = f" - {item.detail}" if item.detail else ""
            doc.bullet(f"{item.title}{suffix}")
    else:
        doc.paragraph("No work items were recorded for this period.")

    # 4. Traffic Growth
    traffic = report.traffic_growth
    doc.section("Traffic Growth")
    if traffic.connected:
        for delta in (traffic.users, traffic.sessions, traffic.conversions):
            doc.bullet(f"{delta.label}: {fmt_delta(delta)}")
    else:
        doc.paragraph("Google Analytics is not connected yet.")

    # 5. Keyword Growth
    keywords = report.keyword_growth
    doc.section("Keyword Growth")
    if keywords.connected:
        for delta in (keywords.clicks, keywords.impressions, keywords.keywords):
            doc.bullet(f"{delta.label}: {fmt_delta(delta)}")
        if keywords.top_queries:
            doc.paragraph("Top queries:")
            for row in keywords.top_queries:
                pos = f", pos {fmt_number(row.position)}" if row.position is not None else ""
                doc.bullet(f"{row.query} - {fmt_number(row.clicks)} clicks{pos}")
    else:
        doc.paragraph("Search Console is not connected yet.")

    # 6. Developer Progress
    dev = report.developer_progress
    doc.section("Developer Progress")
    doc.bullet(f"Completed: {dev.completed}")
    doc.bullet(f"Open: {dev.open}")
    doc.bullet(f"Completion: {dev.completion_pct}% of {dev.total} tracked task(s)")

    # 7. Next Month Roadmap
    doc.section("Next Month Roadmap")
    if report.roadmap:
        for item in report.roadmap:
            suffix = f" - {item.detail}" if item.detail else ""
            doc.bullet(f"{item.title}{suffix}")
    else:
        doc.paragraph("Roadmap to be confirmed.")

    return doc.output()
