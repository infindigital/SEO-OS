"""Assemble an :class:`AnalyticsReport` from a GA4 Data API client.

Three ``runReport`` calls make up a snapshot:

1. No dimensions → site-wide Totals (Users, Sessions, Conversions, Events).
2. ``["pagePath"]``  → Top Pages (by views).
3. ``["eventName"]`` → Events (by count).

The builder is client-agnostic (see :mod:`ga4_sync.client`), so it runs against
the live API or the offline sample identically.
"""

from __future__ import annotations

from .client import AnalyticsClient
from .models import AnalyticsReport, EventRow, PageRow, Totals

# GA4 Data API metric/dimension names, in request order (mirrored by the models).
TOTALS_METRICS = ["totalUsers", "sessions", "conversions", "eventCount"]
PAGE_METRICS = ["screenPageViews", "totalUsers", "sessions"]
EVENT_METRICS = ["eventCount", "totalUsers"]


def build_report(
    client: AnalyticsClient,
    property: str,
    start_date: str,
    end_date: str,
    generated_at: str,
    row_limit: int = 10,
) -> AnalyticsReport:
    """Query ``client`` for totals, top pages and events, and assemble.

    ``row_limit`` bounds Top Pages and Events. ``generated_at`` is passed in
    (not read from the clock) so runs are deterministic.
    """
    if row_limit < 1:
        raise ValueError("row_limit must be >= 1")

    totals = Totals.from_api_rows(
        client.run_report(property, start_date, end_date, [], TOTALS_METRICS, 1)
    )
    top_pages = [
        PageRow.from_api(row)
        for row in client.run_report(
            property, start_date, end_date, ["pagePath"], PAGE_METRICS, row_limit
        )
    ]
    events = [
        EventRow.from_api(row)
        for row in client.run_report(
            property, start_date, end_date, ["eventName"], EVENT_METRICS, row_limit
        )
    ]

    return AnalyticsReport(
        property=property,
        start_date=start_date,
        end_date=end_date,
        generated_at=generated_at,
        totals=totals,
        top_pages=top_pages,
        events=events,
    )
