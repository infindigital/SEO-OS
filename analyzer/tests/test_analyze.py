"""Unit tests for the technical SEO analyzer — one focused test per category."""

from seo_analyzer import analyze_crawl, AnalysisThresholds

FIXED_TS = "2026-07-15T00:00:00Z"


def page(url, **overrides):
    """A healthy, indexable page; override fields to trigger specific issues."""
    base = {
        "url": url,
        "finalUrl": url,
        "statusCode": 200,
        "responseTimeMs": 100,
        "redirectChain": [],
        "title": f"Title for {url}",
        "metaDescription": f"Description for {url}",
        "canonical": url,
        "metaRobots": None,
        "h1": ["Heading"],
        "h2": [],
        "imageCount": 0,
        "imagesMissingAlt": 0,
        "images": [],
        "wordCount": 500,
        "schemaTypes": [],
        "internalLinks": [],
        "externalLinks": [],
        "depth": 0,
        "error": None,
        "crawledAt": FIXED_TS,
    }
    base.update(overrides)
    return base


def analyze(pages, **kw):
    crawl = {
        "startUrl": "https://ex.com/",
        "host": "ex.com",
        "pageCount": len(pages),
        "finishedAt": FIXED_TS,
        "pages": pages,
    }
    return analyze_crawl(crawl, generated_at=FIXED_TS, **kw)


def cats(audit):
    return audit["categories"]


def test_404_errors():
    audit = analyze([page("https://ex.com/missing", statusCode=404)])
    found = cats(audit)["404Errors"]
    assert len(found) == 1
    assert found[0]["url"] == "https://ex.com/missing"
    assert found[0]["statusCode"] == 404
    assert found[0]["severity"] == "error"


def test_redirect_chains():
    audit = analyze(
        [page("https://ex.com/a", redirectChain=["https://ex.com/old", "https://ex.com/mid"])]
    )
    found = cats(audit)["redirectChains"]
    assert len(found) == 1
    assert found[0]["hops"] == 2
    assert found[0]["chain"] == ["https://ex.com/old", "https://ex.com/mid"]


def test_missing_titles():
    audit = analyze([page("https://ex.com/a", title=""), page("https://ex.com/b", title=None)])
    assert len(cats(audit)["missingTitles"]) == 2


def test_missing_descriptions():
    audit = analyze([page("https://ex.com/a", metaDescription="  ")])
    assert len(cats(audit)["missingDescriptions"]) == 1


def test_duplicate_titles_grouped():
    audit = analyze(
        [
            page("https://ex.com/a", title="Same Title"),
            page("https://ex.com/b", title="same title"),  # normalized match
            page("https://ex.com/c", title="Unique"),
        ]
    )
    found = cats(audit)["duplicateTitles"]
    assert len(found) == 1
    assert found[0]["count"] == 2
    assert set(found[0]["urls"]) == {"https://ex.com/a", "https://ex.com/b"}


def test_duplicate_descriptions_grouped():
    audit = analyze(
        [
            page("https://ex.com/a", metaDescription="Shared desc"),
            page("https://ex.com/b", metaDescription="Shared desc"),
        ]
    )
    found = cats(audit)["duplicateDescriptions"]
    assert len(found) == 1
    assert found[0]["count"] == 2


def test_missing_h1():
    audit = analyze([page("https://ex.com/a", h1=[])])
    assert len(cats(audit)["missingH1"]) == 1


def test_broken_links():
    audit = analyze(
        [
            page("https://ex.com/a", internalLinks=["https://ex.com/dead"]),
            page("https://ex.com/dead", statusCode=404),
        ]
    )
    found = cats(audit)["brokenLinks"]
    assert len(found) == 1
    assert found[0]["url"] == "https://ex.com/a"
    assert found[0]["link"] == "https://ex.com/dead"
    assert found[0]["statusCode"] == 404


def test_missing_canonicals():
    audit = analyze([page("https://ex.com/a", canonical=None)])
    assert len(cats(audit)["missingCanonicals"]) == 1


def test_missing_alt_text():
    audit = analyze([page("https://ex.com/a", imageCount=3, imagesMissingAlt=2)])
    found = cats(audit)["missingAltText"]
    assert len(found) == 1
    assert found[0]["count"] == 2
    assert found[0]["severity"] == "notice"


def test_thin_content():
    audit = analyze([page("https://ex.com/a", wordCount=40)])
    found = cats(audit)["thinContent"]
    assert len(found) == 1
    assert found[0]["wordCount"] == 40


def test_thin_content_threshold_is_configurable():
    thresholds = AnalysisThresholds(thin_content_word_count=10)
    audit = analyze([page("https://ex.com/a", wordCount=40)], thresholds=thresholds)
    assert len(cats(audit)["thinContent"]) == 0


def test_noindex_pages_excluded_from_content_rules():
    # A noindex page with no title/h1/canonical and thin content is not flagged.
    audit = analyze(
        [
            page(
                "https://ex.com/n",
                metaRobots="noindex,follow",
                title="",
                h1=[],
                canonical=None,
                wordCount=5,
            )
        ]
    )
    c = cats(audit)
    assert c["missingTitles"] == []
    assert c["missingH1"] == []
    assert c["missingCanonicals"] == []
    assert c["thinContent"] == []


def test_summary_counts():
    audit = analyze(
        [
            page("https://ex.com/a", statusCode=404),
            page("https://ex.com/b", h1=[], canonical=None),
        ]
    )
    summary = audit["summary"]
    assert summary["totalPages"] == 2
    assert summary["byCategory"]["404Errors"] == 1
    assert summary["byCategory"]["missingH1"] == 1
    assert summary["byCategory"]["missingCanonicals"] == 1
    assert summary["bySeverity"]["error"] == 1  # the 404
    assert summary["bySeverity"]["warning"] == 2  # missing h1 + canonical
    assert summary["totalIssues"] == sum(summary["byCategory"].values())


def test_output_shape():
    audit = analyze([page("https://ex.com/a")])
    assert set(audit) == {"source", "generatedAt", "thresholds", "summary", "categories"}
    assert set(audit["source"]) == {"startUrl", "host", "pageCount", "crawledAt"}
    assert audit["generatedAt"] == FIXED_TS
    # Every category key is always present, even when empty.
    expected = {
        "404Errors", "redirectChains", "missingTitles", "missingDescriptions",
        "duplicateTitles", "duplicateDescriptions", "missingH1", "brokenLinks",
        "missingCanonicals", "missingAltText", "thinContent",
    }
    assert set(audit["categories"]) == expected
