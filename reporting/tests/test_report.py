"""Unit tests for the monthly report generator."""

import pytest

from monthly_report import (
    ReportInputs,
    build_report,
    render_markdown,
    render_pdf,
)
from monthly_report.models import MetricDelta
from monthly_report.narrator import ReportFacts, RuleBasedNarrator

GENERATED_AT = "2026-07-16T05:00:00+00:00"


def _inputs(**overrides) -> ReportInputs:
    base = dict(
        client="Acme",
        period="July 2026",
        website="https://acme.com/",
        ga4={"totals": {"users": 8421, "sessions": 11200, "conversions": 342, "events": 53100}},
        ga4_previous={"totals": {"users": 7180, "sessions": 9650, "conversions": 291, "events": 46200}},
        search_console={
            "totals": {"clicks": 4120, "impressions": 88400, "ctr": 0.0466, "position": 11.2},
            "topQueries": [
                {"query": "seo audit tool", "clicks": 412, "position": 4.2},
                {"query": "technical seo checklist", "clicks": 305, "position": 6.1},
            ],
        },
        search_console_previous={
            "totals": {"clicks": 3480, "impressions": 79100, "ctr": 0.044, "position": 12.6},
            "topQueries": [{"query": "seo audit tool", "clicks": 360, "position": 4.9}],
        },
        audit={"summary": {"totalIssues": 9, "estimatedTime": "3h 30m"}},
        audit_previous={"summary": {"totalIssues": 15, "estimatedTime": "5h 58m"}},
        seo_score=78,
        seo_score_previous=71,
        open_tasks=4,
        completed_work=[
            {"title": "Fixed 404s", "detail": "12 URLs", "completedAt": "2026-07-08"},
            {"title": "Added meta descriptions"},
        ],
        roadmap=[{"title": "Improve Core Web Vitals", "detail": "LCP < 2.5s"}],
    )
    base.update(overrides)
    return ReportInputs(**base)


# --- MetricDelta ------------------------------------------------------------


def test_metric_delta_computes_change_and_direction():
    up = MetricDelta("Users", 8421, 7180)
    assert up.change == 1241
    assert up.pct == pytest.approx(17.3, abs=0.1)
    assert up.direction == "up"

    down = MetricDelta("Position", 11, 13)
    assert down.direction == "down"

    flat = MetricDelta("X", 5, 5)
    assert flat.direction == "flat"
    assert flat.pct == 0.0

    new = MetricDelta("Keywords", 42, None)
    assert new.direction == "new"
    assert new.change is None
    assert new.pct is None


def test_metric_delta_zero_baseline_has_no_pct():
    delta = MetricDelta("X", 10, 0)
    assert delta.pct is None
    assert delta.direction == "up"


# --- build_report -----------------------------------------------------------


def test_build_report_assembles_all_seven_sections():
    report = build_report(_inputs(), generated_at=GENERATED_AT)

    assert report.meta.client == "Acme"
    assert report.meta.generated_at == GENERATED_AT
    assert report.executive_summary  # narrated

    # SEO Progress: 15 -> 9 means 6 resolved, 0 new, 9 remaining.
    assert report.seo_progress.issues_resolved == 6
    assert report.seo_progress.issues_new == 0
    assert report.seo_progress.issues_remaining == 9
    assert report.seo_progress.score.current == 78

    # Completed Work + Developer Progress.
    assert len(report.completed_work) == 2
    assert report.developer_progress.completed == 2
    assert report.developer_progress.open == 4
    assert report.developer_progress.completion_pct == pytest.approx(33.3, abs=0.1)

    # Traffic + Keyword growth carry deltas.
    assert report.traffic_growth.users.current == 8421
    assert report.traffic_growth.users.direction == "up"
    assert report.keyword_growth.clicks.current == 4120
    assert report.keyword_growth.keywords.current == 2  # two top queries
    assert report.keyword_growth.top_queries[0].query == "seo audit tool"

    # Roadmap.
    assert report.roadmap[0].title == "Improve Core Web Vitals"


def test_build_report_handles_missing_analytics_gracefully():
    inputs = _inputs(
        ga4=None,
        ga4_previous=None,
        search_console=None,
        search_console_previous=None,
        audit=None,
        audit_previous=None,
        seo_score=None,
    )
    report = build_report(inputs, generated_at=GENERATED_AT)

    assert report.traffic_growth.connected is False
    assert report.keyword_growth.connected is False
    assert report.traffic_growth.users.current == 0
    assert report.seo_progress.score is None
    assert report.seo_progress.issues_remaining == 0
    # Still produces a summary and renders.
    assert report.executive_summary
    assert "Traffic Growth" in render_markdown(report)


def test_new_issues_when_audit_regresses():
    report = build_report(
        _inputs(
            audit={"summary": {"totalIssues": 20}},
            audit_previous={"summary": {"totalIssues": 15}},
        ),
        generated_at=GENERATED_AT,
    )
    assert report.seo_progress.issues_new == 5
    assert report.seo_progress.issues_resolved == 0


# --- Narrator ---------------------------------------------------------------


def test_rule_based_narrator_mentions_key_numbers():
    facts = ReportFacts(
        client="Acme",
        period="July 2026",
        traffic_users=MetricDelta("Users", 8421, 7180),
        sessions=MetricDelta("Sessions", 11200, 9650),
        conversions=MetricDelta("Conversions", 342, 291),
        clicks=MetricDelta("Clicks", 4120, 3480),
        keywords=MetricDelta("Keywords", 42, 38),
        completed=2,
        open_tasks=4,
        completion_pct=33.3,
        issues_resolved=6,
        issues_remaining=9,
        roadmap=["Improve Core Web Vitals"],
    )
    summary = RuleBasedNarrator().summary(facts)
    assert "Acme" in summary
    assert "July 2026" in summary
    assert "4,120" in summary  # clicks, formatted
    assert "Core Web Vitals" in summary


# --- Markdown render --------------------------------------------------------


def test_markdown_has_all_section_headings_in_order():
    md = render_markdown(build_report(_inputs(), generated_at=GENERATED_AT))
    headings = [
        "## Executive Summary",
        "## SEO Progress",
        "## Completed Work",
        "## Traffic Growth",
        "## Keyword Growth",
        "## Developer Progress",
        "## Next Month Roadmap",
    ]
    last = -1
    for heading in headings:
        idx = md.find(heading)
        assert idx != -1, f"missing {heading}"
        assert idx > last, f"{heading} out of order"
        last = idx

    # Deltas and content are present.
    assert "Fixed 404s" in md
    assert "+17.3%" in md  # users growth
    assert "seo audit tool" in md


# --- PDF render -------------------------------------------------------------


def test_pdf_export_produces_a_pdf_document():
    pdf = render_pdf(build_report(_inputs(), generated_at=GENERATED_AT))
    assert isinstance(pdf, (bytes, bytearray))
    assert bytes(pdf).startswith(b"%PDF")
    assert len(pdf) > 1000  # a real multi-section document


def test_pdf_export_is_latin1_safe_with_unicode_content():
    # A non-Latin-1 character in content must not raise.
    report = build_report(
        _inputs(completed_work=[{"title": "Fixed ‘smart quotes’ and — dashes"}]),
        generated_at=GENERATED_AT,
    )
    pdf = render_pdf(report)
    assert bytes(pdf).startswith(b"%PDF")
