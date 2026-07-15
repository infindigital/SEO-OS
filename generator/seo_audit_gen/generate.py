"""Turn an ``audit.json`` into prioritized developer tasks.

Pure and deterministic given a narrator: the structured fields come entirely
from the knowledge base and the audit's own findings.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .knowledge import KNOWLEDGE_BASE, PRIORITY_RANK, CategoryKnowledge


def format_duration(minutes: int) -> str:
    if minutes < 60:
        return f"~{minutes}m"
    hours, remainder = divmod(minutes, 60)
    return f"~{hours}h" if remainder == 0 else f"~{hours}h {remainder}m"


@dataclass
class DeveloperTask:
    id: str
    category: str
    title: str
    severity: str
    priority: str
    technical_audit: str
    business_impact: str
    seo_impact: str
    recommended_fix: str
    acceptance_criteria: str
    estimated_minutes: int
    estimated_time: str
    affected_count: int
    affected: list[str]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "category": self.category,
            "title": self.title,
            "severity": self.severity,
            "priority": self.priority,
            "technicalAudit": self.technical_audit,
            "businessImpact": self.business_impact,
            "seoImpact": self.seo_impact,
            "recommendedFix": self.recommended_fix,
            "acceptanceCriteria": self.acceptance_criteria,
            "estimatedMinutes": self.estimated_minutes,
            "estimatedTime": self.estimated_time,
            "affectedCount": self.affected_count,
            "affected": self.affected,
        }


@dataclass
class GeneratedAudit:
    source: dict
    generated_at: Optional[str]
    executive_summary: str
    totals: dict
    tasks: list[DeveloperTask] = field(default_factory=list)

    @property
    def total_minutes(self) -> int:
        return sum(task.estimated_minutes for task in self.tasks)


def _summarize_category(
    knowledge: CategoryKnowledge, findings: list[dict]
) -> tuple[str, int, int, list[str]]:
    """Return (technical_audit_text, affected_count, item_count, affected_list)
    for one category's findings."""
    key = knowledge.key

    if key in ("duplicateTitles", "duplicateDescriptions"):
        groups = len(findings)
        total_pages = sum(int(f.get("count", 0)) for f in findings)
        noun = "title" if key == "duplicateTitles" else "meta description"
        affected = [
            url for f in findings for url in (f.get("urls") or [])
        ]
        text = (
            f"{groups} duplicated {noun}(s) span {total_pages} indexable pages."
        )
        return text, groups, max(total_pages, 1), affected

    if key == "missingAltText":
        pages = len(findings)
        total_images = sum(int(f.get("count", 0)) for f in findings)
        affected = [f.get("url", "") for f in findings]
        text = (
            f"{pages} page(s) contain {total_images} image(s) without alt text."
        )
        return text, pages, pages, affected

    if key == "brokenLinks":
        count = len(findings)
        affected = [
            f"{f.get('url', '')} → {f.get('link', '')} "
            f"(HTTP {f.get('statusCode', '?')})"
            for f in findings
        ]
        text = f"{count} internal link(s) point to pages returning 4xx/5xx."
        return text, count, count, affected

    count = len(findings)
    affected = [f.get("url", "") for f in findings]
    text = _SIMPLE_TEXT.get(key, "{n} page(s) affected.").format(n=count)
    return text, count, count, affected


_SIMPLE_TEXT = {
    "404Errors": "{n} page(s) returned HTTP 404 (not found).",
    "redirectChains": "{n} page(s) are reached through one or more redirects.",
    "missingTitles": "{n} indexable page(s) have no <title> tag.",
    "missingDescriptions": "{n} indexable page(s) have no meta description.",
    "missingH1": "{n} indexable page(s) have no H1 heading.",
    "missingCanonicals": "{n} indexable page(s) declare no canonical URL.",
    "thinContent": "{n} indexable page(s) fall below the thin-content threshold.",
}


def build_audit(audit: dict, narrator, generated_at: Optional[str] = None) -> GeneratedAudit:
    """Build the generated audit (tasks + executive summary) from an audit dict.

    ``narrator`` must expose ``summary(audit, tasks) -> str``.
    """
    categories: dict[str, list[dict]] = audit.get("categories", {}) or {}

    scored: list[tuple[int, int, DeveloperTask]] = []
    for key, knowledge in KNOWLEDGE_BASE.items():
        findings = categories.get(key) or []
        if not findings:
            continue
        text, affected_count, item_count, affected = _summarize_category(
            knowledge, findings
        )
        minutes = knowledge.estimated_minutes(item_count)
        task = DeveloperTask(
            id="",  # assigned after sorting
            category=key,
            title=knowledge.title,
            severity=knowledge.severity,
            priority=knowledge.priority,
            technical_audit=text,
            business_impact=knowledge.business_impact,
            seo_impact=knowledge.seo_impact,
            recommended_fix=knowledge.recommended_fix,
            acceptance_criteria=knowledge.acceptance_criteria,
            estimated_minutes=minutes,
            estimated_time=format_duration(minutes),
            affected_count=affected_count,
            affected=affected,
        )
        # Sort by severity, then by most-affected, then by category name for
        # a stable, deterministic order.
        scored.append((PRIORITY_RANK[knowledge.severity], -affected_count, task))

    scored.sort(key=lambda item: (item[0], item[1], item[2].category))
    tasks = [task for _, _, task in scored]
    for index, task in enumerate(tasks, start=1):
        task.id = f"TASK-{index}"

    summary = audit.get("summary", {}) or {}
    totals = {
        "totalPages": summary.get("totalPages", 0),
        "totalIssues": summary.get("totalIssues", 0),
        "bySeverity": summary.get("bySeverity", {}),
        "byCategory": summary.get("byCategory", {}),
        "taskCount": len(tasks),
    }

    executive_summary = narrator.summary(audit, tasks)

    return GeneratedAudit(
        source=audit.get("source", {}) or {},
        generated_at=generated_at,
        executive_summary=executive_summary,
        totals=totals,
        tasks=tasks,
    )
