"""Render a :class:`MonthlyReport` to Markdown.

The seven sections are emitted in order: Executive Summary, SEO Progress,
Completed Work, Traffic Growth, Keyword Growth, Developer Progress, and Next
Month Roadmap.
"""

from __future__ import annotations

from .format import fmt_delta, fmt_number
from .models import MonthlyReport


def render_markdown(report: MonthlyReport) -> str:
    lines: list[str] = []
    meta = report.meta

    title = f"# SEO Monthly Report — {meta.client}"
    lines.append(title)
    subtitle = []
    if meta.period:
        subtitle.append(meta.period)
    if meta.website:
        subtitle.append(meta.website)
    if subtitle:
        lines += ["", f"_{' · '.join(subtitle)}_"]
    if meta.generated_at:
        lines += ["", f"_Generated {meta.generated_at}_"]
    lines.append("")

    # 1. Executive Summary
    lines += ["## Executive Summary", "", report.executive_summary, ""]

    # 2. SEO Progress
    seo = report.seo_progress
    lines += ["## SEO Progress", ""]
    if seo.score is not None:
        lines.append(f"- **SEO score:** {fmt_delta(seo.score)}")
    lines += [
        f"- **Issues resolved:** {seo.issues_resolved}",
        f"- **New issues:** {seo.issues_new}",
        f"- **Issues remaining:** {seo.issues_remaining}",
    ]
    if seo.effort_remaining:
        lines.append(f"- **Estimated remediation effort:** {seo.effort_remaining}")
    lines.append("")

    # 3. Completed Work
    lines += ["## Completed Work", ""]
    if report.completed_work:
        for item in report.completed_work:
            suffix = f" — {item.detail}" if item.detail else ""
            when = f" _(completed {item.completed_at})_" if item.completed_at else ""
            lines.append(f"- **{item.title}**{suffix}{when}")
    else:
        lines.append("_No work items were recorded for this period._")
    lines.append("")

    # 4. Traffic Growth
    traffic = report.traffic_growth
    lines += ["## Traffic Growth", ""]
    if traffic.connected:
        lines += [
            "| Metric | This period | Change |",
            "| --- | --- | --- |",
            _row(traffic.users),
            _row(traffic.sessions),
            _row(traffic.conversions),
        ]
    else:
        lines.append("_Google Analytics is not connected yet._")
    lines.append("")

    # 5. Keyword Growth
    keywords = report.keyword_growth
    lines += ["## Keyword Growth", ""]
    if keywords.connected:
        lines += [
            "| Metric | This period | Change |",
            "| --- | --- | --- |",
            _row(keywords.clicks),
            _row(keywords.impressions),
            _row(keywords.keywords),
        ]
        if keywords.top_queries:
            lines += ["", "**Top queries**", ""]
            for row in keywords.top_queries:
                pos = f", pos {fmt_number(row.position)}" if row.position is not None else ""
                lines.append(f"- {row.query} — {fmt_number(row.clicks)} clicks{pos}")
    else:
        lines.append("_Search Console is not connected yet._")
    lines.append("")

    # 6. Developer Progress
    dev = report.developer_progress
    lines += [
        "## Developer Progress",
        "",
        f"- **Completed:** {dev.completed}",
        f"- **Open:** {dev.open}",
        f"- **Completion:** {dev.completion_pct}% of {dev.total} tracked task(s)",
        "",
    ]

    # 7. Next Month Roadmap
    lines += ["## Next Month Roadmap", ""]
    if report.roadmap:
        for item in report.roadmap:
            suffix = f" — {item.detail}" if item.detail else ""
            lines.append(f"- **{item.title}**{suffix}")
    else:
        lines.append("_Roadmap to be confirmed._")
    lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def _row(delta) -> str:
    from .format import fmt_number as _fmt

    change = ""
    if delta.direction == "new" or delta.previous is None:
        change = "new"
    elif delta.direction == "flat":
        change = "flat"
    elif delta.pct is not None:
        sign = "+" if delta.pct > 0 else ""
        change = f"{sign}{delta.pct}% (was {_fmt(delta.previous)})"
    return f"| {delta.label} | {_fmt(delta.current)} | {change} |"
