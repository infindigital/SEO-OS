"""Google Analytics 4 sync.

Pulls a GA4 property's traffic snapshot from the GA4 Data API and writes it to
``ga4.json``: site-wide Users, Sessions, Conversions and Events, plus Top Pages
and Events breakdowns for a date range.

- :mod:`ga4_sync.models`  — the ``ga4.json`` data shape.
- :mod:`ga4_sync.client`  — live (:class:`GoogleAnalyticsClient`) and offline
  (:class:`SampleAnalyticsClient`) API clients behind one protocol.
- :mod:`ga4_sync.report`  — :func:`build_report`, which assembles a snapshot.
- :mod:`ga4_sync.dates`   — the default reporting window.

The CLI (``run_sync.py``) writes snapshots; a scheduled GitHub Actions workflow
runs it on a cron and commits the result back to the repository.
"""

from .client import (
    AnalyticsClient,
    GoogleAnalyticsClient,
    SampleAnalyticsClient,
    normalize_property,
)
from .dates import default_range
from .models import AnalyticsReport, EventRow, PageRow, Totals
from .report import build_report

__all__ = [
    "Totals",
    "PageRow",
    "EventRow",
    "AnalyticsReport",
    "AnalyticsClient",
    "GoogleAnalyticsClient",
    "SampleAnalyticsClient",
    "normalize_property",
    "build_report",
    "default_range",
]
