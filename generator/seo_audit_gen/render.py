"""Render the generated audit to the two Markdown deliverables."""

from __future__ import annotations

from .generate import GeneratedAudit, format_duration

_AFFECTED_LIMIT = 15


def _host(generated: GeneratedAudit) -> str:
    source = generated.source
    return source.get("host") or source.get("startUrl") or "site"


def _affected_block(affected: list[str]) -> list[str]:
    lines = [f"- {item}" for item in affected[:_AFFECTED_LIMIT]]
    remaining = len(affected) - _AFFECTED_LIMIT
    if remaining > 0:
        lines.append(f"- …and {remaining} more")
    return lines


def _severity_counts(generated: GeneratedAudit) -> str:
    by_severity = generated.totals.get("bySeverity", {}) or {}
    return (
        f"{by_severity.get('error', 0)} error, "
        f"{by_severity.get('warning', 0)} warning, "
        f"{by_severity.get('notice', 0)} notice"
    )


def render_technical_audit(generated: GeneratedAudit) -> str:
    lines: list[str] = [f"# Technical SEO Audit — {_host(generated)}", ""]
    if generated.generated_at:
        lines += [f"_Generated {generated.generated_at}_", ""]

    lines += ["## Executive Summary", "", generated.executive_summary, ""]

    lines += [
        "## Overview",
        "",
        f"- **Pages crawled:** {generated.totals.get('totalPages', 0)}",
        f"- **Total issues:** {generated.totals.get('totalIssues', 0)} "
        f"({_severity_counts(generated)})",
        f"- **Developer tasks:** {len(generated.tasks)}",
        f"- **Estimated remediation effort:** {format_duration(generated.total_minutes)}",
        "",
    ]

    lines += ["## Findings", ""]
    if not generated.tasks:
        lines += ["No issues were found. Nothing to fix. 🎉", ""]
        return "\n".join(lines).rstrip() + "\n"

    for task in generated.tasks:
        lines += [
            f"### {task.priority} · {task.title} ({task.severity})",
            "",
            task.technical_audit,
            "",
            f"- **Business impact:** {task.business_impact}",
            f"- **SEO impact:** {task.seo_impact}",
            f"- **Affected:** {task.affected_count} · **Est. effort:** {task.estimated_time}",
            "",
        ]

    return "\n".join(lines).rstrip() + "\n"


def render_developer_tasks(generated: GeneratedAudit) -> str:
    total = format_duration(generated.total_minutes)
    lines: list[str] = [
        f"# Developer Tasks — {_host(generated)}",
        "",
        f"{len(generated.tasks)} task(s) · estimated total effort {total}",
        "",
    ]
    if generated.generated_at:
        lines += [f"_Generated {generated.generated_at}_", ""]

    if not generated.tasks:
        lines += ["No developer tasks — the audit found no issues. 🎉", ""]
        return "\n".join(lines).rstrip() + "\n"

    for task in generated.tasks:
        lines += [
            f"## {task.id} · {task.title}",
            "",
            f"- **Priority:** {task.priority}",
            f"- **Severity:** {task.severity}",
            f"- **Estimated time:** {task.estimated_time}",
            f"- **Affected:** {task.affected_count}",
            "",
            f"**Technical Audit:** {task.technical_audit}",
            "",
            f"**Business Impact:** {task.business_impact}",
            "",
            f"**SEO Impact:** {task.seo_impact}",
            "",
            f"**Recommended Fix:** {task.recommended_fix}",
            "",
            f"**Acceptance Criteria:** {task.acceptance_criteria}",
            "",
            "**Affected URLs:**",
            *_affected_block(task.affected),
            "",
        ]

    return "\n".join(lines).rstrip() + "\n"
