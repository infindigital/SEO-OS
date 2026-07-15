"""Crawl orchestration.

Discovers same-host pages breadth-first (respecting ``max_pages`` /
``max_depth``) and fetches each with Crawl4AI's headless-Chromium engine, then
delegates SEO field extraction to :mod:`seo_crawler.extract`.
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from .extract import extract_page_seo, get_host, normalize_url
from .models import CrawlResult, PageResult


@dataclass
class CrawlOptions:
    max_pages: int = 50
    max_depth: int = 2


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class SeoCrawler:
    """Crawl a website and collect per-page technical SEO data.

    ``browser_config`` and ``run_config`` accept Crawl4AI config objects; when
    omitted, sensible headless defaults are used. They are constructed lazily so
    the pure extraction code can be imported without Crawl4AI installed.
    """

    def __init__(self, browser_config=None, run_config=None):
        self._browser_config = browser_config
        self._run_config = run_config

    def _build_configs(self):
        from crawl4ai import BrowserConfig, CacheMode, CrawlerRunConfig

        browser = self._browser_config or BrowserConfig(
            browser_type="chromium", headless=True, verbose=False
        )
        run = self._run_config or CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            page_timeout=30_000,
            wait_until="domcontentloaded",
            verbose=False,
        )
        return browser, run

    async def crawl(self, start_url: str, options: CrawlOptions) -> CrawlResult:
        from crawl4ai import AsyncWebCrawler

        normalized_start = normalize_url(start_url)
        if normalized_start is None:
            raise ValueError(f"Not a crawlable http(s) URL: {start_url!r}")
        host = get_host(normalized_start)
        if host is None:
            raise ValueError(f"Could not determine host for: {start_url!r}")

        browser_config, run_config = self._build_configs()

        started_at = _now_iso()
        start_perf = time.perf_counter()

        pages: list[PageResult] = []
        visited: set[str] = {normalized_start}
        queue: deque[tuple[str, int]] = deque([(normalized_start, 0)])

        async with AsyncWebCrawler(config=browser_config) as crawler:
            while queue and len(pages) < options.max_pages:
                url, depth = queue.popleft()
                page = await self._fetch_page(crawler, run_config, url, host, depth)
                pages.append(page)

                if page.error is not None or depth >= options.max_depth:
                    continue
                for link in page.internal_links:
                    if link not in visited:
                        visited.add(link)
                        queue.append((link, depth + 1))

        finished_at = _now_iso()
        duration_ms = int((time.perf_counter() - start_perf) * 1000)

        return CrawlResult(
            start_url=normalized_start,
            host=host,
            started_at=started_at,
            finished_at=finished_at,
            duration_ms=duration_ms,
            max_pages=options.max_pages,
            max_depth=options.max_depth,
            pages=pages,
        )

    async def _fetch_page(
        self, crawler, run_config, url: str, host: str, depth: int
    ) -> PageResult:
        crawled_at = _now_iso()
        fetch_start = time.perf_counter()
        try:
            result = await crawler.arun(url=url, config=run_config)
        except Exception as exc:  # noqa: BLE001 — surface any fetch failure per page.
            return self._error_page(url, depth, crawled_at, fetch_start, str(exc), None)

        response_time_ms = int((time.perf_counter() - fetch_start) * 1000)
        status_code = getattr(result, "status_code", None)
        html = getattr(result, "html", "") or ""

        # Key off actual content rather than Crawl4AI's `success` flag: its
        # anti-bot heuristic marks small-but-valid pages as failures, and HTTP
        # error statuses (e.g. 404) still carry a body we want to record. A page
        # is only a hard error when we got no usable HTML back.
        if not html.strip():
            message = getattr(result, "error_message", None) or "Empty response"
            return self._error_page(
                url, depth, crawled_at, fetch_start, message, status_code, response_time_ms
            )

        final_url = normalize_url(getattr(result, "url", None) or url) or url
        redirect_chain: list[str] = []
        redirected = getattr(result, "redirected_url", None)
        if final_url != url or (redirected and normalize_url(redirected) != url):
            redirect_chain = [url]

        seo = extract_page_seo(html, final_url, host)

        return PageResult(
            url=url,
            final_url=final_url,
            status_code=status_code,
            response_time_ms=response_time_ms,
            redirect_chain=redirect_chain,
            title=seo.title,
            meta_description=seo.meta_description,
            canonical=seo.canonical,
            meta_robots=seo.meta_robots,
            h1=seo.h1,
            h2=seo.h2,
            image_count=seo.image_count,
            images_missing_alt=seo.images_missing_alt,
            images=seo.images,
            word_count=seo.word_count,
            schema_types=seo.schema_types,
            internal_links=seo.internal_links,
            external_links=seo.external_links,
            depth=depth,
            error=None,
            crawled_at=crawled_at,
        )

    @staticmethod
    def _error_page(
        url: str,
        depth: int,
        crawled_at: str,
        fetch_start: float,
        message: str,
        status_code: Optional[int],
        response_time_ms: Optional[int] = None,
    ) -> PageResult:
        elapsed = (
            response_time_ms
            if response_time_ms is not None
            else int((time.perf_counter() - fetch_start) * 1000)
        )
        return PageResult(
            url=url,
            final_url=url,
            status_code=status_code,
            response_time_ms=elapsed,
            redirect_chain=[],
            title=None,
            meta_description=None,
            canonical=None,
            meta_robots=None,
            h1=[],
            h2=[],
            image_count=0,
            images_missing_alt=0,
            images=[],
            word_count=0,
            schema_types=[],
            internal_links=[],
            external_links=[],
            depth=depth,
            error=message,
            crawled_at=crawled_at,
        )
