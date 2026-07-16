"""Data model for a Search Console performance snapshot.

These dataclasses define the shape of ``search-console.json``: the six metrics
Task 12 must store — Clicks, Impressions, CTR, Position — plus Top Queries and
Top Pages. ``to_dict`` produces JSON-ready primitives with metrics rounded to a
stable precision so committed snapshots diff cleanly.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


def _round_ctr(ctr: float) -> float:
    """Click-through rate as a 0–1 fraction, rounded to 4 decimals (0.01%)."""
    return round(float(ctr), 4)


def _round_position(position: float) -> float:
    """Average position, rounded to 1 decimal."""
    return round(float(position), 1)


@dataclass(frozen=True)
class AnalyticsRow:
    """A single Search Console row keyed by one dimension value.

    ``key`` is the query text (for Top Queries) or the page URL (for Top Pages).
    """

    key: str
    clicks: int
    impressions: int
    ctr: float
    position: float

    @classmethod
    def from_api(cls, row: dict[str, Any]) -> "AnalyticsRow":
        """Build a row from a raw Search Console ``rows[]`` entry.

        The API returns ``keys`` as a list (one entry per requested dimension);
        single-dimension queries put the value at ``keys[0]``.
        """
        keys = row.get("keys") or []
        return cls(
            key=str(keys[0]) if keys else "",
            clicks=int(row.get("clicks", 0)),
            impressions=int(row.get("impressions", 0)),
            ctr=float(row.get("ctr", 0.0)),
            position=float(row.get("position", 0.0)),
        )

    def to_dict(self, label: str) -> dict[str, Any]:
        """Serialize, naming the dimension field ``label`` (``query``/``page``)."""
        return {
            label: self.key,
            "clicks": self.clicks,
            "impressions": self.impressions,
            "ctr": _round_ctr(self.ctr),
            "position": _round_position(self.position),
        }


@dataclass(frozen=True)
class Totals:
    """Site-wide totals for the reporting window."""

    clicks: int = 0
    impressions: int = 0
    ctr: float = 0.0
    position: float = 0.0

    @classmethod
    def from_api_rows(cls, rows: list[dict[str, Any]]) -> "Totals":
        """Totals come from a no-dimension query, which returns a single row."""
        if not rows:
            return cls()
        row = rows[0]
        return cls(
            clicks=int(row.get("clicks", 0)),
            impressions=int(row.get("impressions", 0)),
            ctr=float(row.get("ctr", 0.0)),
            position=float(row.get("position", 0.0)),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "clicks": self.clicks,
            "impressions": self.impressions,
            "ctr": _round_ctr(self.ctr),
            "position": _round_position(self.position),
        }


@dataclass(frozen=True)
class SearchConsoleReport:
    """A full snapshot for one site over one date range."""

    site: str
    start_date: str
    end_date: str
    generated_at: str
    totals: Totals
    top_queries: list[AnalyticsRow] = field(default_factory=list)
    top_pages: list[AnalyticsRow] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "site": self.site,
            "range": {"startDate": self.start_date, "endDate": self.end_date},
            "generatedAt": self.generated_at,
            "totals": self.totals.to_dict(),
            "topQueries": [row.to_dict("query") for row in self.top_queries],
            "topPages": [row.to_dict("page") for row in self.top_pages],
        }
