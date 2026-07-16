"""Unit tests for the Search Console sync package."""

from datetime import date

import pytest

from sc_sync import (
    AnalyticsRow,
    SampleSearchConsoleClient,
    Totals,
    build_report,
    default_range,
)
from sc_sync.client import GoogleSearchConsoleClient
from sc_sync.models import SearchConsoleReport

GENERATED_AT = "2026-07-16T05:00:00+00:00"


def test_analytics_row_from_api_and_to_dict_rounds_metrics():
    row = AnalyticsRow.from_api(
        {"keys": ["seo audit"], "clicks": 10, "impressions": 200, "ctr": 0.049987, "position": 4.26}
    )
    assert row.key == "seo audit"
    assert row.to_dict("query") == {
        "query": "seo audit",
        "clicks": 10,
        "impressions": 200,
        "ctr": 0.05,  # 4 dp
        "position": 4.3,  # 1 dp
    }


def test_totals_from_empty_rows_is_zeroed():
    assert Totals.from_api_rows([]).to_dict() == {
        "clicks": 0,
        "impressions": 0,
        "ctr": 0.0,
        "position": 0.0,
    }


def test_build_report_shape_against_sample_client():
    report = build_report(
        SampleSearchConsoleClient(),
        site="https://example.com/",
        start_date="2026-06-18",
        end_date="2026-07-15",
        generated_at=GENERATED_AT,
        row_limit=3,
    )
    assert isinstance(report, SearchConsoleReport)

    data = report.to_dict()
    # Top-level shape: the six required metrics plus queries and pages.
    assert data["site"] == "https://example.com/"
    assert data["range"] == {"startDate": "2026-06-18", "endDate": "2026-07-15"}
    assert data["generatedAt"] == GENERATED_AT
    assert set(data["totals"]) == {"clicks", "impressions", "ctr", "position"}
    assert data["totals"]["clicks"] == 1820

    # row_limit is honoured and the dimension fields are named correctly.
    assert len(data["topQueries"]) == 3
    assert len(data["topPages"]) == 3
    assert set(data["topQueries"][0]) == {"query", "clicks", "impressions", "ctr", "position"}
    assert set(data["topPages"][0]) == {"page", "clicks", "impressions", "ctr", "position"}
    assert data["topQueries"][0]["query"] == "seo audit tool"
    assert data["topPages"][0]["page"] == "https://example.com/blog/seo-audit"


def test_build_report_with_custom_sample_rows():
    client = SampleSearchConsoleClient(
        {
            "totals": [{"keys": [], "clicks": 5, "impressions": 100, "ctr": 0.05, "position": 9.0}],
            "query": [{"keys": ["only query"], "clicks": 5, "impressions": 100, "ctr": 0.05, "position": 9.0}],
            "page": [],
        }
    )
    data = build_report(
        client,
        site="sc-domain:example.com",
        start_date="2026-07-01",
        end_date="2026-07-07",
        generated_at=GENERATED_AT,
    ).to_dict()

    assert data["totals"]["clicks"] == 5
    assert [r["query"] for r in data["topQueries"]] == ["only query"]
    assert data["topPages"] == []  # empty bucket → empty list, not an error


def test_build_report_rejects_bad_row_limit():
    with pytest.raises(ValueError):
        build_report(
            SampleSearchConsoleClient(),
            site="https://example.com/",
            start_date="2026-07-01",
            end_date="2026-07-07",
            generated_at=GENERATED_AT,
            row_limit=0,
        )


def test_default_range_is_deterministic_with_injected_today():
    start, end = default_range(days=28, lag=3, today=date(2026, 7, 16))
    assert end == "2026-07-13"  # today - 3
    assert start == "2026-06-16"  # end - 27 (28 inclusive)


def test_default_range_validates_inputs():
    with pytest.raises(ValueError):
        default_range(days=0)
    with pytest.raises(ValueError):
        default_range(lag=-1)


class _FakeService:
    """Records the searchAnalytics request and returns canned rows."""

    def __init__(self, rows):
        self._rows = rows
        self.calls = []

    def searchanalytics(self):
        return self

    def query(self, siteUrl, body):
        self.calls.append({"siteUrl": siteUrl, "body": body})
        return self

    def execute(self):
        return {"rows": self._rows}


def test_google_client_shapes_the_request_and_maps_rows():
    fake = _FakeService([{"keys": ["kw"], "clicks": 3, "impressions": 9, "ctr": 0.33, "position": 2.0}])
    client = GoogleSearchConsoleClient("unused.json", service=fake)

    rows = client.query(
        "https://example.com/", "2026-07-01", "2026-07-07", ["query"], 5
    )

    assert rows == [{"keys": ["kw"], "clicks": 3, "impressions": 9, "ctr": 0.33, "position": 2.0}]
    assert fake.calls[0]["siteUrl"] == "https://example.com/"
    assert fake.calls[0]["body"] == {
        "startDate": "2026-07-01",
        "endDate": "2026-07-07",
        "dimensions": ["query"],
        "rowLimit": 5,
    }


def test_build_report_end_to_end_with_injected_google_service():
    """The whole pipeline works against the live client with a fake service."""
    fake = _FakeService([{"keys": ["x"], "clicks": 1, "impressions": 2, "ctr": 0.5, "position": 1.0}])
    client = GoogleSearchConsoleClient("unused.json", service=fake)

    data = build_report(
        client,
        site="https://example.com/",
        start_date="2026-07-01",
        end_date="2026-07-07",
        generated_at=GENERATED_AT,
        row_limit=1,
    ).to_dict()

    # Three queries issued: totals (no dims), query, page.
    assert [c["body"]["dimensions"] for c in fake.calls] == [[], ["query"], ["page"]]
    assert data["totals"]["clicks"] == 1
