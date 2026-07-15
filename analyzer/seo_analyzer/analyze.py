"""Rule-based technical SEO analysis.

``analyze_crawl`` is pure: given the same crawl and thresholds it always
produces the same audit. No AI, no I/O.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from .thresholds import DEFAULT_THRESHOLDS, AnalysisThresholds

# (category key, severity) in the order they appear in the audit output.
CATEGORIES: list[tuple[str, str]] = [
    ("404Errors", "error"),
    ("redirectChains", "warning"),
    ("missingTitles", "warning"),
    ("missingDescriptions", "warning"),
    ("duplicateTitles", "warning"),
    ("duplicateDescriptions", "warning"),
    ("missingH1", "warning"),
    ("brokenLinks", "error"),
    ("missingCanonicals", "warning"),
    ("missingAltText", "notice"),
    ("thinContent", "warning"),
]

_SEVERITY = dict(CATEGORIES)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _is_success(status: Optional[int]) -> bool:
    return isinstance(status, int) and 200 <= status < 300


def _is_noindex(page: dict) -> bool:
    return "noindex" in (page.get("metaRobots") or "").lower()


def _is_indexable(page: dict) -> bool:
    return _is_success(page.get("statusCode")) and not _is_noindex(page)


def _blank(value: Optional[str]) -> bool:
    return value is None or not str(value).strip()


def _normalize(value: str) -> str:
    return " ".join(value.split()).lower()


def analyze_crawl(
    crawl: dict,
    thresholds: AnalysisThresholds = DEFAULT_THRESHOLDS,
    generated_at: Optional[str] = None,
) -> dict:
    """Analyze a crawl (parsed ``crawl.json``) and return the audit structure."""
    pages: list[dict] = crawl.get("pages", []) or []

    findings: dict[str, list[dict]] = {key: [] for key, _ in CATEGORIES}

    def add(category: str, url: str, message: str, **extra) -> None:
        findings[category].append(
            {"url": url, "severity": _SEVERITY[category], "message": message, **extra}
        )

    # Map every crawled URL (requested and final) to its HTTP status so we can
    # tell whether an internal link points at a broken page.
    status_by_url: dict[str, Optional[int]] = {}
    for page in pages:
        url = page.get("url")
        if url:
            status_by_url[url] = page.get("statusCode")
        final_url = page.get("finalUrl")
        if final_url:
            status_by_url.setdefault(final_url, page.get("statusCode"))

    title_groups: dict[str, list[str]] = {}
    description_groups: dict[str, list[str]] = {}

    for page in pages:
        url = page.get("url", "")
        status = page.get("statusCode")

        if status == 404:
            add("404Errors", url, "Page returned HTTP 404 (not found).", statusCode=404)

        redirect_chain = page.get("redirectChain") or []
        hops = len(redirect_chain)
        if hops >= thresholds.redirect_chain_min_hops:
            add(
                "redirectChains",
                url,
                f"Reached via {hops} redirect hop(s) before the final URL.",
                hops=hops,
                chain=redirect_chain,
            )

        if _is_indexable(page):
            title = page.get("title")
            if _blank(title):
                add("missingTitles", url, "Page has no <title>.")
            else:
                title_groups.setdefault(_normalize(title), []).append(url)

            description = page.get("metaDescription")
            if _blank(description):
                add("missingDescriptions", url, "Page has no meta description.")
            else:
                description_groups.setdefault(_normalize(description), []).append(url)

            if not (page.get("h1") or []):
                add("missingH1", url, "Page has no H1 heading.")

            if page.get("canonical") is None:
                add("missingCanonicals", url, "Page has no canonical URL.")

            word_count = page.get("wordCount", 0) or 0
            if word_count < thresholds.thin_content_word_count:
                add(
                    "thinContent",
                    url,
                    f"Thin content: {word_count} words "
                    f"(below {thresholds.thin_content_word_count}).",
                    wordCount=word_count,
                )

        missing_alt = page.get("imagesMissingAlt", 0) or 0
        if missing_alt > 0:
            add(
                "missingAltText",
                url,
                f"{missing_alt} image(s) missing alt text.",
                count=missing_alt,
            )

        for link in page.get("internalLinks", []) or []:
            link_status = status_by_url.get(link)
            if isinstance(link_status, int) and link_status >= 400:
                add(
                    "brokenLinks",
                    url,
                    f"Links to {link} which returned HTTP {link_status}.",
                    link=link,
                    statusCode=link_status,
                )

    _emit_duplicates(
        findings["duplicateTitles"], title_groups, "Title", _SEVERITY["duplicateTitles"]
    )
    _emit_duplicates(
        findings["duplicateDescriptions"],
        description_groups,
        "Meta description",
        _SEVERITY["duplicateDescriptions"],
    )

    return _assemble(crawl, pages, findings, thresholds, generated_at or _now_iso())


def _emit_duplicates(
    bucket: list[dict], groups: dict[str, list[str]], label: str, severity: str
) -> None:
    for value, urls in groups.items():
        if len(urls) > 1:
            bucket.append(
                {
                    "value": value,
                    "count": len(urls),
                    "urls": urls,
                    "severity": severity,
                    "message": f"{label} shared by {len(urls)} pages.",
                }
            )


def _assemble(
    crawl: dict,
    pages: list[dict],
    findings: dict[str, list[dict]],
    thresholds: AnalysisThresholds,
    generated_at: str,
) -> dict:
    by_category = {key: len(findings[key]) for key, _ in CATEGORIES}
    by_severity = {"error": 0, "warning": 0, "notice": 0}
    for key, severity in CATEGORIES:
        by_severity[severity] += by_category[key]
    total_issues = sum(by_category.values())

    return {
        "source": {
            "startUrl": crawl.get("startUrl"),
            "host": crawl.get("host"),
            "pageCount": crawl.get("pageCount", len(pages)),
            "crawledAt": crawl.get("finishedAt"),
        },
        "generatedAt": generated_at,
        "thresholds": thresholds.to_dict(),
        "summary": {
            "totalPages": len(pages),
            "totalIssues": total_issues,
            "byCategory": by_category,
            "bySeverity": by_severity,
        },
        "categories": findings,
    }
