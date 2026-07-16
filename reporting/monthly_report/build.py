"""Assemble a :class:`MonthlyReport` from :class:`ReportInputs`.

Each of the seven sections is computed here from the pipeline artifacts and the
supplied work/roadmap, growth deltas included. The Executive Summary is written
last, from a compact fact view, by the pluggable narrator.
"""

from __future__ import annotations

from .models import (
    DeveloperProgress,
    KeywordGrowth,
    KeywordRow,
    MetricDelta,
    MonthlyReport,
    ReportMeta,
    RoadmapItem,
    SeoProgress,
    TrafficGrowth,
    WorkItem,
)
from .narrator import Narrator, ReportFacts, RuleBasedNarrator
from .sources import (
    ReportInputs,
    audit_effort,
    audit_issue_total,
    ga4_metric,
    sc_keyword_count,
    sc_metric,
    sc_top_queries,
)

_TOP_QUERY_LIMIT = 5


def _num(value, default=0):
    return default if value is None else value


def _seo_progress(inputs: ReportInputs) -> SeoProgress:
    score = None
    if inputs.seo_score is not None:
        score = MetricDelta("SEO score", inputs.seo_score, inputs.seo_score_previous)

    current = audit_issue_total(inputs.audit)
    previous = audit_issue_total(inputs.audit_previous)

    resolved = 0
    new = 0
    if current is not None and previous is not None:
        diff = previous - current
        resolved = max(diff, 0)
        new = max(-diff, 0)

    return SeoProgress(
        score=score,
        issues_resolved=resolved,
        issues_new=new,
        issues_remaining=_num(current, 0),
        effort_remaining=audit_effort(inputs.audit),
    )


def _traffic_growth(inputs: ReportInputs) -> TrafficGrowth:
    connected = inputs.ga4 is not None
    return TrafficGrowth(
        users=MetricDelta(
            "Users", _num(ga4_metric(inputs.ga4, "users")), ga4_metric(inputs.ga4_previous, "users")
        ),
        sessions=MetricDelta(
            "Sessions", _num(ga4_metric(inputs.ga4, "sessions")), ga4_metric(inputs.ga4_previous, "sessions")
        ),
        conversions=MetricDelta(
            "Conversions", _num(ga4_metric(inputs.ga4, "conversions")), ga4_metric(inputs.ga4_previous, "conversions")
        ),
        connected=connected,
    )


def _keyword_growth(inputs: ReportInputs) -> KeywordGrowth:
    connected = inputs.search_console is not None
    top = [
        KeywordRow(
            query=row.get("query", ""),
            clicks=int(row.get("clicks", 0)),
            position=row.get("position"),
        )
        for row in sc_top_queries(inputs.search_console)[:_TOP_QUERY_LIMIT]
    ]
    return KeywordGrowth(
        clicks=MetricDelta(
            "Clicks", _num(sc_metric(inputs.search_console, "clicks")), sc_metric(inputs.search_console_previous, "clicks")
        ),
        impressions=MetricDelta(
            "Impressions",
            _num(sc_metric(inputs.search_console, "impressions")),
            sc_metric(inputs.search_console_previous, "impressions"),
        ),
        keywords=MetricDelta(
            "Ranking keywords",
            sc_keyword_count(inputs.search_console),
            sc_keyword_count(inputs.search_console_previous) if inputs.search_console_previous else None,
        ),
        top_queries=top,
        connected=connected,
    )


def _completed_work(inputs: ReportInputs) -> list[WorkItem]:
    return [
        WorkItem(
            title=item.get("title", "Untitled task"),
            detail=item.get("detail"),
            completed_at=item.get("completedAt") or item.get("completed_at"),
        )
        for item in inputs.completed_work
    ]


def _roadmap(inputs: ReportInputs) -> list[RoadmapItem]:
    return [
        RoadmapItem(title=item.get("title", "Untitled"), detail=item.get("detail"))
        for item in inputs.roadmap
    ]


def _facts(inputs: ReportInputs, report_bits) -> ReportFacts:
    traffic, keywords, seo, dev, roadmap = report_bits
    return ReportFacts(
        client=inputs.client,
        period=inputs.period,
        traffic_users=traffic.users,
        sessions=traffic.sessions,
        conversions=traffic.conversions,
        clicks=keywords.clicks,
        keywords=keywords.keywords,
        completed=dev.completed,
        open_tasks=dev.open,
        completion_pct=dev.completion_pct,
        issues_resolved=seo.issues_resolved,
        issues_remaining=seo.issues_remaining,
        roadmap=[item.title for item in roadmap],
    )


def build_report(
    inputs: ReportInputs,
    generated_at: str,
    narrator: Narrator | None = None,
) -> MonthlyReport:
    """Assemble the seven-section monthly report.

    ``generated_at`` is passed in (not read from the clock) so runs are
    deterministic. ``narrator`` defaults to the rule-based summary.
    """
    narrator = narrator or RuleBasedNarrator()

    seo = _seo_progress(inputs)
    traffic = _traffic_growth(inputs)
    keywords = _keyword_growth(inputs)
    completed = _completed_work(inputs)
    roadmap = _roadmap(inputs)
    dev = DeveloperProgress(completed=len(completed), open=inputs.open_tasks)

    facts = _facts(inputs, (traffic, keywords, seo, dev, roadmap))
    executive_summary = narrator.summary(facts)

    return MonthlyReport(
        meta=ReportMeta(
            client=inputs.client,
            website=inputs.website,
            period=inputs.period,
            generated_at=generated_at,
        ),
        executive_summary=executive_summary,
        seo_progress=seo,
        completed_work=completed,
        traffic_growth=traffic,
        keyword_growth=keywords,
        developer_progress=dev,
        roadmap=roadmap,
    )
