"""Search Console API clients.

The report builder depends only on the :class:`SearchConsoleClient` protocol —
``query(...) -> list[dict]`` returning raw Search Console ``rows``. Two
implementations are provided:

- :class:`GoogleSearchConsoleClient` — the live adapter over the Google Search
  Console REST API, authenticated with a service account. The Google client
  libraries are imported lazily so the package (and its tests) import without
  them installed.
- :class:`SampleSearchConsoleClient` — an offline double that returns canned
  rows, dispatched by the requested dimensions. Used for tests and for
  ``--sample`` runs in environments without credentials.
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

# Read-only Search Console scope — the sync never writes to the property.
SCOPES = ("https://www.googleapis.com/auth/webmasters.readonly",)


@runtime_checkable
class SearchConsoleClient(Protocol):
    def query(
        self,
        site: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        row_limit: int,
    ) -> list[dict[str, Any]]:  # pragma: no cover - protocol definition
        """Return the raw ``rows`` for a searchAnalytics query."""
        ...


class GoogleSearchConsoleClient:
    """Live client over the Search Console REST API (service-account auth).

    ``credentials_file`` is the path to a Google service-account JSON key whose
    service account has been granted access to the Search Console property. The
    ``google-api-python-client`` and ``google-auth`` packages are only required
    for live runs; they are imported lazily on first use.
    """

    def __init__(self, credentials_file: str, service: Any | None = None):
        self._credentials_file = credentials_file
        self._service = service

    def _build_service(self) -> Any:
        if self._service is not None:
            return self._service

        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
        except ImportError as exc:  # pragma: no cover - depends on optional deps.
            raise RuntimeError(
                "Live Search Console sync requires 'google-api-python-client' and "
                "'google-auth'. Install them with "
                "'pip install -r searchconsole/requirements.txt', or run with "
                "--sample for an offline snapshot."
            ) from exc

        credentials = service_account.Credentials.from_service_account_file(
            self._credentials_file, scopes=list(SCOPES)
        )
        self._service = build(
            "searchconsole", "v1", credentials=credentials, cache_discovery=False
        )
        return self._service

    def query(
        self,
        site: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        row_limit: int,
    ) -> list[dict[str, Any]]:
        service = self._build_service()
        body: dict[str, Any] = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": row_limit,
        }
        response = (
            service.searchanalytics()
            .query(siteUrl=site, body=body)
            .execute()
        )
        return list(response.get("rows", []))


class SampleSearchConsoleClient:
    """Offline client returning canned rows, dispatched by dimension.

    ``rows_by_dimension`` maps a dimension key to the rows returned for it:
    ``"totals"`` for the no-dimension query, ``"query"`` for Top Queries, and
    ``"page"`` for Top Pages. Rows are returned in the shape of the real API
    (``{"keys": [...], "clicks": ..., ...}``) and truncated to ``row_limit``.
    """

    def __init__(self, rows_by_dimension: dict[str, list[dict[str, Any]]] | None = None):
        self._rows = rows_by_dimension or _DEFAULT_SAMPLE

    def query(
        self,
        site: str,
        start_date: str,
        end_date: str,
        dimensions: list[str],
        row_limit: int,
    ) -> list[dict[str, Any]]:
        bucket = dimensions[0] if dimensions else "totals"
        rows = self._rows.get(bucket, [])
        return [dict(row) for row in rows[:row_limit]]


_DEFAULT_SAMPLE: dict[str, list[dict[str, Any]]] = {
    "totals": [
        {"keys": [], "clicks": 1820, "impressions": 45230, "ctr": 0.0402, "position": 12.4}
    ],
    "query": [
        {"keys": ["seo audit tool"], "clicks": 412, "impressions": 6100, "ctr": 0.0675, "position": 4.2},
        {"keys": ["technical seo checklist"], "clicks": 305, "impressions": 5400, "ctr": 0.0565, "position": 6.1},
        {"keys": ["core web vitals fix"], "clicks": 221, "impressions": 3900, "ctr": 0.0567, "position": 7.8},
        {"keys": ["schema markup guide"], "clicks": 168, "impressions": 3100, "ctr": 0.0542, "position": 9.3},
        {"keys": ["crawl budget optimization"], "clicks": 96, "impressions": 2400, "ctr": 0.0400, "position": 11.5},
    ],
    "page": [
        {"keys": ["https://example.com/blog/seo-audit"], "clicks": 540, "impressions": 8200, "ctr": 0.0659, "position": 5.0},
        {"keys": ["https://example.com/tools/checklist"], "clicks": 388, "impressions": 6700, "ctr": 0.0579, "position": 6.4},
        {"keys": ["https://example.com/blog/core-web-vitals"], "clicks": 254, "impressions": 4500, "ctr": 0.0564, "position": 8.1},
        {"keys": ["https://example.com/blog/schema"], "clicks": 173, "impressions": 3300, "ctr": 0.0524, "position": 9.9},
        {"keys": ["https://example.com/pricing"], "clicks": 121, "impressions": 2600, "ctr": 0.0465, "position": 10.7},
    ],
}
