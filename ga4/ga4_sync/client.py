"""Google Analytics 4 Data API clients.

The report builder depends only on the :class:`AnalyticsClient` protocol —
``run_report(...) -> list[dict]`` returning raw GA4 ``rows``. Two
implementations are provided:

- :class:`GoogleAnalyticsClient` — the live adapter over the GA4 Data API
  (``runReport``), authenticated with a service account. It issues REST calls
  through an authorized session; the Google auth libraries are imported lazily,
  so the package (and its tests) import without them installed.
- :class:`SampleAnalyticsClient` — an offline double returning canned rows,
  dispatched by the requested report kind. Used for tests and for ``--sample``
  runs in environments without credentials.
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

# Read-only Analytics scope — the sync never writes to the property.
SCOPES = ("https://www.googleapis.com/auth/analytics.readonly",)

DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta"


def normalize_property(property_id: str) -> str:
    """Accept ``123456`` or ``properties/123456`` and return the resource name."""
    property_id = property_id.strip()
    if property_id.startswith("properties/"):
        return property_id
    return f"properties/{property_id}"


@runtime_checkable
class AnalyticsClient(Protocol):
    def run_report(
        self,
        property: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        metrics: list[str],
        limit: int,
    ) -> list[dict[str, Any]]:  # pragma: no cover - protocol definition
        """Return the raw ``rows`` for a GA4 ``runReport`` request."""
        ...


class GoogleAnalyticsClient:
    """Live client over the GA4 Data API (service-account auth).

    ``credentials_file`` is the path to a Google service-account JSON key whose
    service account has been granted Viewer access to the GA4 property. The
    ``google-auth`` libraries are only required for live runs; they are imported
    lazily on first use. ``session`` (any object with ``.post(url, json=...)``
    returning a response with ``.json()`` and ``.raise_for_status()``) is
    injectable so request shaping and row mapping can be tested offline.
    """

    def __init__(self, credentials_file: str, session: Any | None = None):
        self._credentials_file = credentials_file
        self._session = session

    def _build_session(self) -> Any:
        if self._session is not None:
            return self._session

        try:
            from google.oauth2 import service_account
            from google.auth.transport.requests import AuthorizedSession
        except ImportError as exc:  # pragma: no cover - depends on optional deps.
            raise RuntimeError(
                "Live GA4 sync requires 'google-auth'. Install it with "
                "'pip install -r ga4/requirements.txt', or run with --sample "
                "for an offline snapshot."
            ) from exc

        credentials = service_account.Credentials.from_service_account_file(
            self._credentials_file, scopes=list(SCOPES)
        )
        self._session = AuthorizedSession(credentials)
        return self._session

    def run_report(
        self,
        property: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        metrics: list[str],
        limit: int,
    ) -> list[dict[str, Any]]:
        session = self._build_session()
        body: dict[str, Any] = {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "dimensions": [{"name": name} for name in dimensions],
            "metrics": [{"name": name} for name in metrics],
            "limit": limit,
        }
        # Order dimensioned reports by their first (primary) metric, descending,
        # so Top Pages and Events come back ranked.
        if dimensions and metrics:
            body["orderBys"] = [
                {"metric": {"metricName": metrics[0]}, "desc": True}
            ]

        url = f"{DATA_API_BASE}/{normalize_property(property)}:runReport"
        response = session.post(url, json=body)
        response.raise_for_status()
        return list(response.json().get("rows", []))


class SampleAnalyticsClient:
    """Offline client returning canned rows, dispatched by report kind.

    ``rows_by_kind`` maps a kind to its rows: ``"totals"`` for the no-dimension
    query, ``"pagePath"`` for Top Pages, and ``"eventName"`` for Events. Rows
    are in the GA4 API shape (``{"dimensionValues": [...], "metricValues":
    [...]}``) and truncated to ``limit``.
    """

    def __init__(self, rows_by_kind: dict[str, list[dict[str, Any]]] | None = None):
        self._rows = rows_by_kind or _DEFAULT_SAMPLE

    def run_report(
        self,
        property: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        metrics: list[str],
        limit: int,
    ) -> list[dict[str, Any]]:
        kind = dimensions[0] if dimensions else "totals"
        rows = self._rows.get(kind, [])
        return [
            {"dimensionValues": list(r.get("dimensionValues", [])), "metricValues": list(r.get("metricValues", []))}
            for r in rows[:limit]
        ]


def _m(*values: Any) -> list[dict[str, str]]:
    return [{"value": str(v)} for v in values]


def _d(value: str) -> list[dict[str, str]]:
    return [{"value": value}]


_DEFAULT_SAMPLE: dict[str, list[dict[str, Any]]] = {
    # totals metric order: totalUsers, sessions, conversions, eventCount
    "totals": [{"dimensionValues": [], "metricValues": _m(8421, 11200, 342, 53100)}],
    # pagePath metric order: screenPageViews, totalUsers, sessions
    "pagePath": [
        {"dimensionValues": _d("/"), "metricValues": _m(9800, 5400, 6200)},
        {"dimensionValues": _d("/blog/seo-audit"), "metricValues": _m(4300, 3100, 3500)},
        {"dimensionValues": _d("/pricing"), "metricValues": _m(3100, 2400, 2600)},
        {"dimensionValues": _d("/tools/checklist"), "metricValues": _m(2050, 1500, 1650)},
        {"dimensionValues": _d("/contact"), "metricValues": _m(1200, 980, 1010)},
    ],
    # eventName metric order: eventCount, totalUsers
    "eventName": [
        {"dimensionValues": _d("page_view"), "metricValues": _m(24800, 8200)},
        {"dimensionValues": _d("session_start"), "metricValues": _m(11200, 8100)},
        {"dimensionValues": _d("scroll"), "metricValues": _m(9400, 6100)},
        {"dimensionValues": _d("form_submit"), "metricValues": _m(640, 520)},
        {"dimensionValues": _d("purchase"), "metricValues": _m(342, 300)},
    ],
}
