"""Data model for a monthly client report.

A :class:`MonthlyReport` is assembled from the file-pipeline artifacts (GA4,
Search Console, the technical audit) plus completed work and a roadmap, and
carries the seven sections Task 14 requires: Executive Summary, SEO Progress,
Completed Work, Traffic Growth, Keyword Growth, Developer Progress and Next
Month Roadmap. The renderers (Markdown, PDF) consume this structure — no
computation happens at render time.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

Number = float | int


def _pct(current: Number, previous: Number | None) -> float | None:
    """Percentage change vs a baseline, or ``None`` when it can't be computed."""
    if previous is None or previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


@dataclass(frozen=True)
class MetricDelta:
    """A single metric with its prior-period baseline and computed change."""

    label: str
    current: Number
    previous: Number | None = None

    @property
    def change(self) -> Number | None:
        if self.previous is None:
            return None
        return round(self.current - self.previous, 2)

    @property
    def pct(self) -> float | None:
        return _pct(self.current, self.previous)

    @property
    def direction(self) -> str:
        """``new`` (no baseline), or ``up`` / ``down`` / ``flat``."""
        if self.previous is None:
            return "new"
        if self.current > self.previous:
            return "up"
        if self.current < self.previous:
            return "down"
        return "flat"

    def to_dict(self) -> dict[str, Any]:
        return {
            "label": self.label,
            "current": self.current,
            "previous": self.previous,
            "change": self.change,
            "pct": self.pct,
            "direction": self.direction,
        }


@dataclass(frozen=True)
class WorkItem:
    title: str
    detail: str | None = None
    completed_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {"title": self.title, "detail": self.detail, "completedAt": self.completed_at}


@dataclass(frozen=True)
class RoadmapItem:
    title: str
    detail: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {"title": self.title, "detail": self.detail}


@dataclass(frozen=True)
class KeywordRow:
    query: str
    clicks: int
    position: float | None = None

    def to_dict(self) -> dict[str, Any]:
        return {"query": self.query, "clicks": self.clicks, "position": self.position}


@dataclass(frozen=True)
class SeoProgress:
    score: MetricDelta | None
    issues_resolved: int
    issues_new: int
    issues_remaining: int
    effort_remaining: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "score": self.score.to_dict() if self.score else None,
            "issuesResolved": self.issues_resolved,
            "issuesNew": self.issues_new,
            "issuesRemaining": self.issues_remaining,
            "effortRemaining": self.effort_remaining,
        }


@dataclass(frozen=True)
class TrafficGrowth:
    users: MetricDelta
    sessions: MetricDelta
    conversions: MetricDelta
    connected: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "connected": self.connected,
            "users": self.users.to_dict(),
            "sessions": self.sessions.to_dict(),
            "conversions": self.conversions.to_dict(),
        }


@dataclass(frozen=True)
class KeywordGrowth:
    clicks: MetricDelta
    impressions: MetricDelta
    keywords: MetricDelta
    top_queries: list[KeywordRow] = field(default_factory=list)
    connected: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "connected": self.connected,
            "clicks": self.clicks.to_dict(),
            "impressions": self.impressions.to_dict(),
            "keywords": self.keywords.to_dict(),
            "topQueries": [row.to_dict() for row in self.top_queries],
        }


@dataclass(frozen=True)
class DeveloperProgress:
    completed: int
    open: int

    @property
    def total(self) -> int:
        return self.completed + self.open

    @property
    def completion_pct(self) -> float:
        if self.total == 0:
            return 0.0
        return round(self.completed / self.total * 100, 1)

    def to_dict(self) -> dict[str, Any]:
        return {
            "completed": self.completed,
            "open": self.open,
            "total": self.total,
            "completionPct": self.completion_pct,
        }


@dataclass(frozen=True)
class ReportMeta:
    client: str
    website: str | None
    period: str
    generated_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "client": self.client,
            "website": self.website,
            "period": self.period,
            "generatedAt": self.generated_at,
        }


@dataclass(frozen=True)
class MonthlyReport:
    """The seven-section monthly report."""

    meta: ReportMeta
    executive_summary: str
    seo_progress: SeoProgress
    completed_work: list[WorkItem]
    traffic_growth: TrafficGrowth
    keyword_growth: KeywordGrowth
    developer_progress: DeveloperProgress
    roadmap: list[RoadmapItem]

    def to_dict(self) -> dict[str, Any]:
        return {
            "meta": self.meta.to_dict(),
            "executiveSummary": self.executive_summary,
            "seoProgress": self.seo_progress.to_dict(),
            "completedWork": [item.to_dict() for item in self.completed_work],
            "trafficGrowth": self.traffic_growth.to_dict(),
            "keywordGrowth": self.keyword_growth.to_dict(),
            "developerProgress": self.developer_progress.to_dict(),
            "roadmap": [item.to_dict() for item in self.roadmap],
        }
