"""Google Search Console sync.

Pulls a site's search-performance snapshot from the Search Console API and
writes it to ``search-console.json``: site-wide Clicks, Impressions, CTR and
Position, plus Top Queries and Top Pages for a date range.

- :mod:`sc_sync.models`  — the ``search-console.json`` data shape.
- :mod:`sc_sync.client`  — live (:class:`GoogleSearchConsoleClient`) and offline
  (:class:`SampleSearchConsoleClient`) API clients behind one protocol.
- :mod:`sc_sync.report`  — :func:`build_report`, which assembles a snapshot.
- :mod:`sc_sync.dates`   — the default reporting window.

The CLI (``run_sync.py``) writes snapshots; a scheduled GitHub Actions workflow
runs it on a cron and commits the result back to the repository.
"""

from .client import (
    GoogleSearchConsoleClient,
    SampleSearchConsoleClient,
    SearchConsoleClient,
)
from .dates import default_range
from .models import AnalyticsRow, SearchConsoleReport, Totals
from .report import build_report

__all__ = [
    "AnalyticsRow",
    "Totals",
    "SearchConsoleReport",
    "SearchConsoleClient",
    "GoogleSearchConsoleClient",
    "SampleSearchConsoleClient",
    "build_report",
    "default_range",
]
