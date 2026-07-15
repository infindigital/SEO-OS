"""Technical SEO analyzer.

Reads a ``crawl.json`` (produced by the crawler) and generates ``audit.json``:
a rule-based technical SEO audit. Pure and deterministic — no AI, no network,
no browser.
"""

from .thresholds import DEFAULT_THRESHOLDS, AnalysisThresholds
from .analyze import analyze_crawl, CATEGORIES

__all__ = [
    "analyze_crawl",
    "CATEGORIES",
    "AnalysisThresholds",
    "DEFAULT_THRESHOLDS",
]
