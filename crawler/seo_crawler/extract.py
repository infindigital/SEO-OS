"""Pure HTML → SEO field extraction.

No I/O and no browser here: everything is a deterministic function of an HTML
string plus the URLs it was fetched from, which keeps it fully unit-testable.
URL and link normalization intentionally mirror the TypeScript crawler
(`backend/domain/crawl/*`) so both engines emit an interchangeable schema.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urljoin, urlsplit, urlunsplit

from lxml import html as lxml_html

_WEB_SCHEMES = ("http", "https")


def normalize_url(href: str, base: Optional[str] = None) -> Optional[str]:
    """Resolve ``href`` (optionally against ``base``) to an absolute http(s)
    URL with the fragment stripped, or ``None`` if it is not a usable address.
    """
    if href is None:
        return None
    candidate = href.strip()
    if not candidate:
        return None
    try:
        resolved = urljoin(base, candidate) if base else candidate
        parts = urlsplit(resolved)
    except ValueError:
        return None
    if parts.scheme not in _WEB_SCHEMES or not parts.netloc:
        return None
    # Strip the fragment; keep query and path intact.
    return urlunsplit((parts.scheme, parts.netloc, parts.path, parts.query, ""))


def get_host(url: str) -> Optional[str]:
    """Return the lowercased ``host[:port]`` of an absolute URL, or ``None``."""
    try:
        parts = urlsplit(url)
    except ValueError:
        return None
    if not parts.hostname:
        return None
    host = parts.hostname.lower()
    if parts.port is not None:
        host = f"{host}:{parts.port}"
    return host


@dataclass
class ClassifiedLinks:
    internal: list[str]
    external: list[str]


def classify_links(hrefs: list[str], host: str, base: str) -> ClassifiedLinks:
    """Split raw hrefs into internal (same host) and external links, normalized
    to absolute http(s) URLs and de-duplicated while preserving first-seen order.
    """
    normalized_host = host.lower()
    internal: dict[str, None] = {}
    external: dict[str, None] = {}

    for href in hrefs:
        normalized = normalize_url(href, base)
        if not normalized:
            continue
        link_host = get_host(normalized)
        if link_host is None:
            continue
        bucket = internal if link_host == normalized_host else external
        bucket.setdefault(normalized, None)

    return ClassifiedLinks(list(internal.keys()), list(external.keys()))


def count_words(text: str) -> int:
    """Count words by collapsing runs of whitespace."""
    normalized = " ".join(text.split())
    if not normalized:
        return 0
    return len(normalized.split(" "))


def _text_of(nodes) -> list[str]:
    values = []
    for node in nodes:
        text = node.text_content().strip()
        if text:
            values.append(" ".join(text.split()))
    return values


def _collect_schema_types(value, acc: list[str]) -> None:
    """Walk a parsed JSON-LD value collecting every ``@type`` string."""
    if isinstance(value, dict):
        raw_type = value.get("@type")
        if isinstance(raw_type, str):
            acc.append(raw_type)
        elif isinstance(raw_type, list):
            acc.extend(t for t in raw_type if isinstance(t, str))
        # @graph and other nested containers may hold more typed nodes.
        for nested in value.values():
            if isinstance(nested, (dict, list)):
                _collect_schema_types(nested, acc)
    elif isinstance(value, list):
        for item in value:
            _collect_schema_types(item, acc)


def extract_schema_types(tree) -> list[str]:
    """De-duplicated list of JSON-LD ``@type`` values found on the page."""
    seen: dict[str, None] = {}
    for script in tree.xpath('//script[@type="application/ld+json"]'):
        raw = script.text_content()
        if not raw or not raw.strip():
            continue
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            continue
        types: list[str] = []
        _collect_schema_types(data, types)
        for t in types:
            seen.setdefault(t, None)
    return list(seen.keys())


def _meta_content(tree, name: str) -> Optional[str]:
    for node in tree.xpath(f'//meta[translate(@name,"{name.upper()}","{name.lower()}")="{name.lower()}"]'):
        content = node.get("content")
        if content and content.strip():
            return content.strip()
    return None


def _body_word_count(html: str) -> int:
    # Parse an independent copy so stripping non-content elements never mutates
    # the tree the other extractors read from.
    tree = lxml_html.fromstring(html or "<html></html>")
    for node in tree.xpath("//script | //style | //noscript | //template"):
        node.getparent().remove(node)
    body = tree.find("body")
    root = body if body is not None else tree
    # Join text nodes with spaces so adjacent block elements don't merge into a
    # single token (lxml's text_content concatenates them without separators).
    return count_words(" ".join(root.itertext()))


@dataclass
class PageSeo:
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


def extract_page_seo(html: str, base_url: str, host: str) -> PageSeo:
    """Extract every SEO field that can be derived from a page's HTML."""
    tree = lxml_html.fromstring(html or "<html></html>")

    title_nodes = tree.xpath("//title")
    title = None
    if title_nodes:
        text = title_nodes[0].text_content().strip()
        title = " ".join(text.split()) if text else None

    canonical = None
    for link in tree.xpath('//link[@rel="canonical"]'):
        href = link.get("href")
        resolved = normalize_url(href, base_url) if href else None
        if resolved:
            canonical = resolved
            break

    images: list[dict] = []
    missing_alt = 0
    img_nodes = tree.xpath("//img")
    for img in img_nodes:
        alt = img.get("alt")
        if alt is None or not alt.strip():
            missing_alt += 1
        src = img.get("src")
        resolved = normalize_url(src, base_url) if src else None
        if resolved:
            images.append({"url": resolved, "bytes": None})

    hrefs = [a.get("href") for a in tree.xpath("//a[@href]")]
    links = classify_links([h for h in hrefs if h], host, base_url)

    return PageSeo(
        title=title,
        meta_description=_meta_content(tree, "description"),
        canonical=canonical,
        meta_robots=_meta_content(tree, "robots"),
        h1=_text_of(tree.xpath("//h1")),
        h2=_text_of(tree.xpath("//h2")),
        image_count=len(img_nodes),
        images_missing_alt=missing_alt,
        images=images,
        word_count=_body_word_count(html),
        schema_types=extract_schema_types(tree),
        internal_links=links.internal,
        external_links=links.external,
    )
