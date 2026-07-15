"""Serializable result models.

The JSON shape intentionally matches the TypeScript crawler's ``CrawlResult`` /
``PageAudit`` (`backend/domain/crawl/*`) so a crawl produced by either engine
feeds the same downstream analysis unchanged.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PageResult:
    url: str
    final_url: str
    status_code: Optional[int]
    response_time_ms: int
    redirect_chain: list[str]
    title: Optional[str]
    meta_description: Optional[str]
    canonical: Optional[str]
    meta_robots: Optional[str]
    h1: list[str]
    h2: list[str]
    image_count: int
    images_missing_alt: int
    images: list[dict]
    word_count: int
    schema_types: list[str]
    internal_links: list[str]
    external_links: list[str]
    depth: int
    error: Optional[str]
    crawled_at: str

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "finalUrl": self.final_url,
            "statusCode": self.status_code,
            "responseTimeMs": self.response_time_ms,
            "redirectChain": self.redirect_chain,
            "title": self.title,
            "metaDescription": self.meta_description,
            "canonical": self.canonical,
            "metaRobots": self.meta_robots,
            "h1": self.h1,
            "h2": self.h2,
            "imageCount": self.image_count,
            "imagesMissingAlt": self.images_missing_alt,
            "images": self.images,
            "wordCount": self.word_count,
            "schemaTypes": self.schema_types,
            "internalLinks": self.internal_links,
            "externalLinks": self.external_links,
            "depth": self.depth,
            "error": self.error,
            "crawledAt": self.crawled_at,
        }


@dataclass
class CrawlResult:
    start_url: str
    host: str
    started_at: str
    finished_at: str
    duration_ms: int
    max_pages: int
    max_depth: int
    pages: list[PageResult] = field(default_factory=list)

    @property
    def page_count(self) -> int:
        return len(self.pages)

    def to_dict(self) -> dict:
        return {
            "startUrl": self.start_url,
            "host": self.host,
            "startedAt": self.started_at,
            "finishedAt": self.finished_at,
            "durationMs": self.duration_ms,
            "options": {"maxPages": self.max_pages, "maxDepth": self.max_depth},
            "pageCount": self.page_count,
            "pages": [page.to_dict() for page in self.pages],
        }
