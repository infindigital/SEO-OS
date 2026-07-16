"""Inputs for the monthly report and how to load them.

:class:`ReportInputs` is the neutral bundle the builder consumes. It can be
assembled directly (from already-parsed data, as the tests do) or loaded from a
JSON config that points at the file-pipeline artifacts — ``ga4.json``,
``search-console.json`` and ``audit.json`` — with optional ``previous``
snapshots so the report can show growth.

All extraction is defensive: a missing artifact yields a *not connected*
section rather than an error, so a report can always be produced.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def load_json(path: str | Path) -> dict[str, Any]:
    """Load a JSON object from ``path`` (returns ``{}`` for a blank file)."""
    text = Path(path).read_text(encoding="utf-8").strip()
    if not text:
        return {}
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError(f"Expected a JSON object in {path}, got {type(data).__name__}")
    return data


def _load_optional(path: str | None) -> dict[str, Any] | None:
    if not path:
        return None
    return load_json(path)


# --- Extraction from the pipeline artifact shapes ---------------------------


def ga4_metric(ga4: dict[str, Any] | None, name: str) -> float | int | None:
    """A GA4 total (users/sessions/conversions/events), or ``None`` if absent."""
    if not ga4:
        return None
    totals = ga4.get("totals") or {}
    return totals.get(name)


def ga4_top_pages(ga4: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not ga4:
        return []
    return list(ga4.get("topPages") or [])


def sc_metric(sc: dict[str, Any] | None, name: str) -> float | int | None:
    """A Search Console total (clicks/impressions/ctr/position), or ``None``."""
    if not sc:
        return None
    totals = sc.get("totals") or {}
    return totals.get(name)


def sc_top_queries(sc: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not sc:
        return []
    return list(sc.get("topQueries") or [])


def sc_keyword_count(sc: dict[str, Any] | None) -> int:
    """Number of ranking queries in a Search Console snapshot."""
    if not sc:
        return 0
    return len(sc.get("topQueries") or [])


def audit_issue_total(audit: dict[str, Any] | None) -> int | None:
    if not audit:
        return None
    summary = audit.get("summary") or {}
    return summary.get("totalIssues")


def audit_effort(audit: dict[str, Any] | None) -> str | None:
    if not audit:
        return None
    summary = audit.get("summary") or {}
    return summary.get("estimatedTime")


@dataclass(frozen=True)
class ReportInputs:
    """Everything the builder needs to assemble a :class:`MonthlyReport`."""

    client: str
    period: str
    website: str | None = None

    ga4: dict[str, Any] | None = None
    ga4_previous: dict[str, Any] | None = None
    search_console: dict[str, Any] | None = None
    search_console_previous: dict[str, Any] | None = None
    audit: dict[str, Any] | None = None
    audit_previous: dict[str, Any] | None = None

    seo_score: int | None = None
    seo_score_previous: int | None = None

    completed_work: list[dict[str, Any]] = field(default_factory=list)
    open_tasks: int = 0
    roadmap: list[dict[str, Any]] = field(default_factory=list)

    @classmethod
    def from_config(cls, config: dict[str, Any], base_dir: str | Path = ".") -> "ReportInputs":
        """Build inputs from a config dict that references artifact file paths.

        Recognised keys: ``client``, ``period``, ``website``, ``seoScore``,
        ``seoScorePrevious``, ``openTasks``, ``completedWork`` (list),
        ``roadmap`` (list), and file references ``ga4``/``ga4Previous``,
        ``searchConsole``/``searchConsolePrevious``, ``audit``/``auditPrevious``
        (paths relative to ``base_dir``).
        """
        base = Path(base_dir)

        def ref(key: str) -> str | None:
            value = config.get(key)
            return str(base / value) if value else None

        return cls(
            client=config.get("client", "Client"),
            period=config.get("period", ""),
            website=config.get("website"),
            ga4=_load_optional(ref("ga4")),
            ga4_previous=_load_optional(ref("ga4Previous")),
            search_console=_load_optional(ref("searchConsole")),
            search_console_previous=_load_optional(ref("searchConsolePrevious")),
            audit=_load_optional(ref("audit")),
            audit_previous=_load_optional(ref("auditPrevious")),
            seo_score=config.get("seoScore"),
            seo_score_previous=config.get("seoScorePrevious"),
            completed_work=list(config.get("completedWork") or []),
            open_tasks=int(config.get("openTasks") or 0),
            roadmap=list(config.get("roadmap") or []),
        )
