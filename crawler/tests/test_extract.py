"""Unit tests for the pure SEO extraction logic (no browser required)."""

from seo_crawler.extract import (
    classify_links,
    count_words,
    extract_page_seo,
    extract_schema_types,
    get_host,
    normalize_url,
)
from lxml import html as lxml_html


class TestNormalizeUrl:
    def test_resolves_relative_against_base(self):
        assert (
            normalize_url("/about", "https://example.com/team")
            == "https://example.com/about"
        )

    def test_strips_fragment_keeps_query(self):
        assert (
            normalize_url("https://example.com/p?x=1#frag")
            == "https://example.com/p?x=1"
        )

    def test_rejects_non_web_schemes(self):
        assert normalize_url("mailto:hi@example.com") is None
        assert normalize_url("javascript:void(0)") is None
        assert normalize_url("tel:+15551234") is None

    def test_rejects_blank(self):
        assert normalize_url("") is None
        assert normalize_url("   ") is None


class TestGetHost:
    def test_lowercases_host(self):
        assert get_host("https://Example.COM/x") == "example.com"

    def test_includes_non_default_port(self):
        assert get_host("http://localhost:8099/x") == "localhost:8099"


class TestClassifyLinks:
    def test_splits_internal_and_external_deduped(self):
        links = [
            "/a",
            "/a",  # dup
            "https://example.com/b",
            "https://other.com/c",
            "mailto:x@example.com",  # discarded
        ]
        result = classify_links(links, "example.com", "https://example.com/")
        assert result.internal == [
            "https://example.com/a",
            "https://example.com/b",
        ]
        assert result.external == ["https://other.com/c"]


class TestCountWords:
    def test_collapses_whitespace(self):
        assert count_words("  hello   world\n\tagain ") == 3

    def test_empty(self):
        assert count_words("   ") == 0


class TestSchemaTypes:
    def test_extracts_type_string_and_list_and_graph(self):
        html = """
        <html><head>
          <script type="application/ld+json">{"@type":"WebPage"}</script>
          <script type="application/ld+json">{"@type":["Article","BlogPosting"]}</script>
          <script type="application/ld+json">{"@graph":[{"@type":"Organization"}]}</script>
          <script type="application/ld+json">not json</script>
        </head><body></body></html>
        """
        tree = lxml_html.fromstring(html)
        assert extract_schema_types(tree) == [
            "WebPage",
            "Article",
            "BlogPosting",
            "Organization",
        ]


class TestExtractPageSeo:
    HTML = """
    <!doctype html>
    <html><head>
      <title>  My  Title </title>
      <meta name="Description" content="  A description  ">
      <meta name="robots" content="noindex,follow">
      <link rel="canonical" href="/canonical">
      <script type="application/ld+json">{"@type":"WebPage"}</script>
    </head><body>
      <h1>First H1</h1><h1>Second H1</h1>
      <h2>A sub</h2>
      <p>One two three four five words.</p>
      <img src="/img1.png" alt="described">
      <img src="/img2.png">
      <img src="/img3.png" alt="   ">
      <a href="/internal">In</a>
      <a href="https://external.example/x">Ext</a>
      <script>var ignored = "not counted";</script>
    </body></html>
    """

    def seo(self):
        return extract_page_seo(
            self.HTML, "https://example.com/page", "example.com"
        )

    def test_title_trimmed_and_collapsed(self):
        assert self.seo().title == "My Title"

    def test_meta_description_case_insensitive_name(self):
        assert self.seo().meta_description == "A description"

    def test_meta_robots(self):
        assert self.seo().meta_robots == "noindex,follow"

    def test_canonical_absolutized(self):
        assert self.seo().canonical == "https://example.com/canonical"

    def test_headings(self):
        seo = self.seo()
        assert seo.h1 == ["First H1", "Second H1"]
        assert seo.h2 == ["A sub"]

    def test_image_counts_and_missing_alt(self):
        seo = self.seo()
        assert seo.image_count == 3
        # img2 has no alt, img3 has whitespace-only alt → 2 missing.
        assert seo.images_missing_alt == 2
        assert seo.images == [
            {"url": "https://example.com/img1.png", "bytes": None},
            {"url": "https://example.com/img2.png", "bytes": None},
            {"url": "https://example.com/img3.png", "bytes": None},
        ]

    def test_word_count_excludes_scripts(self):
        # Visible text = "First H1 Second H1 A sub One two three four five
        # words. In Ext" = 14 words; the <script> body is not counted.
        assert self.seo().word_count == 14

    def test_links_classified(self):
        seo = self.seo()
        assert seo.internal_links == ["https://example.com/internal"]
        assert seo.external_links == ["https://external.example/x"]

    def test_schema_types(self):
        assert self.seo().schema_types == ["WebPage"]
