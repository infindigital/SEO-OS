"""SEO crawler (Version 1) — a Crawl4AI + Playwright crawler.

Fetches pages with Crawl4AI's headless-Chromium engine, extracts per-page
technical SEO data, and writes the result as ``crawl.json``. No analysis is
performed here — that is a separate stage.
"""

from .models import CrawlResult, PageResult
from .crawler import SeoCrawler, CrawlOptions

__all__ = ["SeoCrawler", "CrawlOptions", "CrawlResult", "PageResult"]
