"""Data model for a Google Analytics 4 snapshot.

These dataclasses define the shape of ``ga4.json``: the metrics Task 13 must
store — Users, Sessions, Conversions (site-wide totals) — plus Top Pages and
Events. Rows come from the GA4 Data API ``runReport`` response, whose values
arrive as strings; the parsers here coerce them to clean JSON numbers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


def _dimension(row: dict[str, Any], index: int = 0) -> str:
    values = row.get("dimensionValues") or []
    if index < len(values):
        return str(values[index].get("value", ""))
    return ""


def _metric_raw(row: dict[str, Any], index: int) -> str:
    values = row.get("metricValues") or []
    if index < len(values):
        return str(values[index].get("value", "0"))
    return "0"


def _as_int(raw: str) -> int:
    """GA4 integer metrics (users, sessions, events, views) arrive as strings."""
    try:
        return int(float(raw))
    except (TypeError, ValueError):
        return 0


def _as_number(raw: str) -> float | int:
    """A count that may be fractional (e.g. attributed conversions).

    Whole values render as ``int`` so JSON stays clean; fractional values keep
    two decimals.
    """
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return 0
    return int(value) if value.is_integer() else round(value, 2)


@dataclass(frozen=True)
class Totals:
    """Site-wide totals for the reporting window."""

    users: int = 0
    sessions: int = 0
    conversions: float | int = 0
    events: int = 0

    @classmethod
    def from_api_rows(cls, rows: list[dict[str, Any]]) -> "Totals":
        """A no-dimension ``runReport`` returns a single aggregate row.

        Metric order (request order): totalUsers, sessions, conversions,
        eventCount.
        """
        if not rows:
            return cls()
        row = rows[0]
        return cls(
            users=_as_int(_metric_raw(row, 0)),
            sessions=_as_int(_metric_raw(row, 1)),
            conversions=_as_number(_metric_raw(row, 2)),
            events=_as_int(_metric_raw(row, 3)),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "users": self.users,
            "sessions": self.sessions,
            "conversions": self.conversions,
            "events": self.events,
        }


@dataclass(frozen=True)
class PageRow:
    """A Top Pages row keyed by page path.

    Metric order (request order): screenPageViews, totalUsers, sessions.
    """

    page: str
    views: int
    users: int
    sessions: int

    @classmethod
    def from_api(cls, row: dict[str, Any]) -> "PageRow":
        return cls(
            page=_dimension(row),
            views=_as_int(_metric_raw(row, 0)),
            users=_as_int(_metric_raw(row, 1)),
            sessions=_as_int(_metric_raw(row, 2)),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "page": self.page,
            "views": self.views,
            "users": self.users,
            "sessions": self.sessions,
        }


@dataclass(frozen=True)
class EventRow:
    """An Events row keyed by event name.

    Metric order (request order): eventCount, totalUsers.
    """

    event: str
    count: int
    users: int

    @classmethod
    def from_api(cls, row: dict[str, Any]) -> "EventRow":
        return cls(
            event=_dimension(row),
            count=_as_int(_metric_raw(row, 0)),
            users=_as_int(_metric_raw(row, 1)),
        )

    def to_dict(self) -> dict[str, Any]:
        return {"event": self.event, "count": self.count, "users": self.users}


@dataclass(frozen=True)
class AnalyticsReport:
    """A full GA4 snapshot for one property over one date range."""

    property: str
    start_date: str
    end_date: str
    generated_at: str
    totals: Totals
    top_pages: list[PageRow] = field(default_factory=list)
    events: list[EventRow] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "property": self.property,
            "range": {"startDate": self.start_date, "endDate": self.end_date},
            "generatedAt": self.generated_at,
            "totals": self.totals.to_dict(),
            "topPages": [row.to_dict() for row in self.top_pages],
            "events": [row.to_dict() for row in self.events],
        }
