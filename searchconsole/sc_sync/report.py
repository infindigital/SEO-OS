"""Assemble a :class:`SearchConsoleReport` from a Search Console client.

Three queries make up a snapshot:

1. No dimensions → site-wide Totals (Clicks, Impressions, CTR, Position).
2. ``["query"]`` → Top Queries.
3. ``["page"]``  → Top Pages.

The builder is client-agnostic (see :mod:`sc_sync.client`), so it runs against
the live API or the offline sample identically.
"""

from __future__ import annotations

from .client import SearchConsoleClient
from .models import AnalyticsRow, SearchConsoleReport, Totals


def build_report(
    client: SearchConsoleClient,
    site: str,
    start_date: str,
    end_date: str,
    generated_at: str,
    row_limit: int = 10,
) -> SearchConsoleReport:
    """Query ``client`` for totals, top queries and top pages, and assemble.

    ``row_limit`` bounds Top Queries and Top Pages. ``generated_at`` is passed
    in (not read from the clock) so runs are deterministic.
    """
    if row_limit < 1:
        raise ValueError("row_limit must be >= 1")

    totals = Totals.from_api_rows(
        client.query(site, start_date, end_date, [], 1)
    )
    top_queries = [
        AnalyticsRow.from_api(row)
        for row in client.query(site, start_date, end_date, ["query"], row_limit)
    ]
    top_pages = [
        AnalyticsRow.from_api(row)
        for row in client.query(site, start_date, end_date, ["page"], row_limit)
    ]

    return SearchConsoleReport(
        site=site,
        start_date=start_date,
        end_date=end_date,
        generated_at=generated_at,
        totals=totals,
        top_queries=top_queries,
        top_pages=top_pages,
    )
