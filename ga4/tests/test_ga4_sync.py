"""Unit tests for the GA4 sync package."""

from datetime import date

import pytest

from ga4_sync import (
    AnalyticsReport,
    EventRow,
    PageRow,
    SampleAnalyticsClient,
    Totals,
    build_report,
    default_range,
    normalize_property,
)
from ga4_sync.client import GoogleAnalyticsClient

GENERATED_AT = "2026-07-16T05:00:00+00:00"


def _row(dimension, *metrics):
    return {
        "dimensionValues": ([{"value": dimension}] if dimension is not None else []),
        "metricValues": [{"value": str(m)} for m in metrics],
    }


def test_normalize_property_accepts_bare_id_and_resource_name():
    assert normalize_property("123456789") == "properties/123456789"
    assert normalize_property("properties/123456789") == "properties/123456789"
    assert normalize_property("  42 ") == "properties/42"


def test_totals_parse_string_metrics():
    totals = Totals.from_api_rows([_row(None, 8421, 11200, 342, 53100)])
    assert totals.to_dict() == {
        "users": 8421,
        "sessions": 11200,
        "conversions": 342,
        "events": 53100,
    }


def test_totals_conversions_keeps_fractional_values():
    totals = Totals.from_api_rows([_row(None, 10, 12, "3.5", 40)])
    assert totals.conversions == 3.5
    # Whole floats collapse to int for clean JSON.
    assert Totals.from_api_rows([_row(None, 1, 1, "2.0", 1)]).conversions == 2


def test_totals_empty_rows_is_zeroed():
    assert Totals.from_api_rows([]).to_dict() == {
        "users": 0,
        "sessions": 0,
        "conversions": 0,
        "events": 0,
    }


def test_page_and_event_rows_map_positionally():
    page = PageRow.from_api(_row("/pricing", 3100, 2400, 2600))
    assert page.to_dict() == {"page": "/pricing", "views": 3100, "users": 2400, "sessions": 2600}

    event = EventRow.from_api(_row("purchase", 342, 300))
    assert event.to_dict() == {"event": "purchase", "count": 342, "users": 300}


def test_build_report_shape_against_sample_client():
    report = build_report(
        SampleAnalyticsClient(),
        property="properties/123456789",
        start_date="2026-06-18",
        end_date="2026-07-15",
        generated_at=GENERATED_AT,
        row_limit=3,
    )
    assert isinstance(report, AnalyticsReport)

    data = report.to_dict()
    assert data["property"] == "properties/123456789"
    assert data["range"] == {"startDate": "2026-06-18", "endDate": "2026-07-15"}
    assert data["generatedAt"] == GENERATED_AT
    assert set(data["totals"]) == {"users", "sessions", "conversions", "events"}
    assert data["totals"]["users"] == 8421

    # row_limit honoured; dimension fields named correctly.
    assert len(data["topPages"]) == 3
    assert len(data["events"]) == 3
    assert set(data["topPages"][0]) == {"page", "views", "users", "sessions"}
    assert set(data["events"][0]) == {"event", "count", "users"}
    assert data["topPages"][0]["page"] == "/"
    assert data["events"][0]["event"] == "page_view"


def test_build_report_with_custom_sample_rows():
    client = SampleAnalyticsClient(
        {
            "totals": [_row(None, 5, 7, 1, 20)],
            "pagePath": [_row("/only", 9, 4, 5)],
            "eventName": [],
        }
    )
    data = build_report(
        client,
        property="123",
        start_date="2026-07-01",
        end_date="2026-07-07",
        generated_at=GENERATED_AT,
    ).to_dict()

    assert data["totals"]["sessions"] == 7
    assert [p["page"] for p in data["topPages"]] == ["/only"]
    assert data["events"] == []  # empty bucket → empty list, not an error


def test_build_report_rejects_bad_row_limit():
    with pytest.raises(ValueError):
        build_report(
            SampleAnalyticsClient(),
            property="123",
            start_date="2026-07-01",
            end_date="2026-07-07",
            generated_at=GENERATED_AT,
            row_limit=0,
        )


def test_default_range_is_deterministic_with_injected_today():
    start, end = default_range(days=28, lag=1, today=date(2026, 7, 16))
    assert end == "2026-07-15"  # today - 1
    assert start == "2026-06-18"  # end - 27 (28 inclusive)


def test_default_range_validates_inputs():
    with pytest.raises(ValueError):
        default_range(days=0)
    with pytest.raises(ValueError):
        default_range(lag=-1)


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class _FakeSession:
    """Records runReport POSTs and returns canned rows."""

    def __init__(self, rows):
        self._rows = rows
        self.calls = []

    def post(self, url, json):
        self.calls.append({"url": url, "body": json})
        return _FakeResponse({"rows": self._rows})


def test_google_client_shapes_the_request_and_maps_rows():
    fake = _FakeSession([_row("/", 10, 5, 6)])
    client = GoogleAnalyticsClient("unused.json", session=fake)

    rows = client.run_report(
        "properties/123", "2026-07-01", "2026-07-07",
        ["pagePath"], ["screenPageViews", "totalUsers", "sessions"], 5,
    )

    assert rows == [_row("/", 10, 5, 6)]
    call = fake.calls[0]
    assert call["url"].endswith("/properties/123:runReport")
    assert call["body"]["dateRanges"] == [{"startDate": "2026-07-01", "endDate": "2026-07-07"}]
    assert call["body"]["dimensions"] == [{"name": "pagePath"}]
    assert call["body"]["metrics"] == [
        {"name": "screenPageViews"}, {"name": "totalUsers"}, {"name": "sessions"}
    ]
    assert call["body"]["limit"] == 5
    # Dimensioned reports are ordered by the primary metric, descending.
    assert call["body"]["orderBys"] == [{"metric": {"metricName": "screenPageViews"}, "desc": True}]


def test_totals_request_has_no_dimensions_or_ordering():
    fake = _FakeSession([_row(None, 8, 9, 1, 20)])
    client = GoogleAnalyticsClient("unused.json", session=fake)

    client.run_report("properties/123", "a", "b", [], ["totalUsers"], 1)

    body = fake.calls[0]["body"]
    assert body["dimensions"] == []
    assert "orderBys" not in body  # no ordering without a dimension


def test_build_report_end_to_end_with_injected_session():
    fake = _FakeSession([_row("/", 1, 2, 3)])
    client = GoogleAnalyticsClient("unused.json", session=fake)

    build_report(
        client,
        property="properties/123",
        start_date="2026-07-01",
        end_date="2026-07-07",
        generated_at=GENERATED_AT,
        row_limit=1,
    )

    # Three reports issued: totals (no dims), pagePath, eventName.
    dims = [c["body"]["dimensions"] for c in fake.calls]
    assert dims == [[], [{"name": "pagePath"}], [{"name": "eventName"}]]
