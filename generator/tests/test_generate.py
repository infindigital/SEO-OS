"""Tests for task generation and Markdown rendering."""

from seo_audit_gen import build_audit, RuleBasedNarrator
from seo_audit_gen.knowledge import KNOWLEDGE_BASE
from seo_audit_gen.generate import format_duration
from seo_audit_gen.render import render_developer_tasks, render_technical_audit

# The 11 categories the analyzer emits — the generator must cover every one.
ANALYZER_CATEGORIES = {
    "404Errors", "redirectChains", "missingTitles", "missingDescriptions",
    "duplicateTitles", "duplicateDescriptions", "missingH1", "brokenLinks",
    "missingCanonicals", "missingAltText", "thinContent",
}


def sample_audit():
    return {
        "source": {"startUrl": "https://ex.com/", "host": "ex.com", "pageCount": 6},
        "generatedAt": "2026-07-15T00:00:00Z",
        "summary": {
            "totalPages": 6,
            "totalIssues": 7,
            "bySeverity": {"error": 2, "warning": 4, "notice": 1},
            "byCategory": {},
        },
        "categories": {
            "404Errors": [
                {"url": "https://ex.com/gone", "severity": "error"},
            ],
            "brokenLinks": [
                {
                    "url": "https://ex.com/",
                    "link": "https://ex.com/gone",
                    "statusCode": 404,
                    "severity": "error",
                },
            ],
            "missingH1": [
                {"url": "https://ex.com/a"},
                {"url": "https://ex.com/b"},
            ],
            "duplicateTitles": [
                {"value": "home", "count": 2, "urls": ["https://ex.com/", "https://ex.com/a"]},
            ],
            "missingAltText": [
                {"url": "https://ex.com/", "count": 3},
            ],
            "thinContent": [
                {"url": "https://ex.com/a", "wordCount": 30},
            ],
        },
    }


def test_knowledge_base_covers_every_analyzer_category():
    assert set(KNOWLEDGE_BASE) == ANALYZER_CATEGORIES


def test_format_duration():
    assert format_duration(45) == "~45m"
    assert format_duration(60) == "~1h"
    assert format_duration(150) == "~2h 30m"


def test_only_present_categories_become_tasks():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    categories = {task.category for task in generated.tasks}
    assert categories == {
        "404Errors", "brokenLinks", "missingH1", "duplicateTitles",
        "missingAltText", "thinContent",
    }


def test_tasks_are_prioritized_errors_first_then_by_volume():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    severities = [task.severity for task in generated.tasks]
    # All errors precede all warnings precede all notices.
    assert severities == sorted(
        severities, key=lambda s: {"error": 0, "warning": 1, "notice": 2}[s]
    )
    # IDs are assigned in priority order.
    assert [t.id for t in generated.tasks] == [
        f"TASK-{i}" for i in range(1, len(generated.tasks) + 1)
    ]
    # First task is an error.
    assert generated.tasks[0].severity == "error"


def test_task_carries_all_seven_fields():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    task = next(t for t in generated.tasks if t.category == "404Errors")
    assert task.priority == "P1"
    assert task.technical_audit  # Technical Audit
    assert task.business_impact  # Business Impact
    assert task.seo_impact       # SEO Impact
    assert task.recommended_fix  # Recommended Fix
    assert task.acceptance_criteria  # Acceptance Criteria
    assert task.estimated_time.startswith("~")  # Estimated Time
    assert task.affected == ["https://ex.com/gone"]


def test_duplicate_titles_summarized_by_group_and_pages():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    task = next(t for t in generated.tasks if t.category == "duplicateTitles")
    assert task.affected_count == 1  # one duplicated group
    assert "2 indexable pages" in task.technical_audit
    assert set(task.affected) == {"https://ex.com/", "https://ex.com/a"}


def test_broken_links_render_source_and_target():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    task = next(t for t in generated.tasks if t.category == "brokenLinks")
    assert "→ https://ex.com/gone" in task.affected[0]
    assert "HTTP 404" in task.affected[0]


def test_missing_alt_counts_images():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    task = next(t for t in generated.tasks if t.category == "missingAltText")
    assert "3 image(s)" in task.technical_audit
    assert task.priority == "P3"


def test_empty_audit_produces_no_tasks():
    audit = {
        "source": {"host": "ex.com"},
        "summary": {"totalPages": 3, "totalIssues": 0, "bySeverity": {}},
        "categories": {},
    }
    generated = build_audit(audit, RuleBasedNarrator())
    assert generated.tasks == []
    assert "No issues" in render_technical_audit(generated)
    assert "No developer tasks" in render_developer_tasks(generated)


def test_technical_audit_markdown_has_sections():
    generated = build_audit(sample_audit(), RuleBasedNarrator(), generated_at="2026-07-15T00:00:00Z")
    md = render_technical_audit(generated)
    assert md.startswith("# Technical SEO Audit — ex.com")
    assert "## Executive Summary" in md
    assert "## Overview" in md
    assert "## Findings" in md
    assert "Business impact:" in md


def test_developer_tasks_markdown_has_all_fields():
    generated = build_audit(sample_audit(), RuleBasedNarrator())
    md = render_developer_tasks(generated)
    assert md.startswith("# Developer Tasks — ex.com")
    for label in (
        "**Priority:**", "**Estimated time:**", "**Technical Audit:**",
        "**Business Impact:**", "**SEO Impact:**", "**Recommended Fix:**",
        "**Acceptance Criteria:**", "**Affected URLs:**",
    ):
        assert label in md
    assert "## TASK-1 ·" in md
