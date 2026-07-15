"""Curated SEO knowledge base.

Maps each analyzer issue category to expert guidance: business impact, SEO
impact, the recommended fix, acceptance criteria, and an effort model. These are
deterministic and reviewed — the parts of an audit you never want a model to
invent — so the generator reads them straight from here.
"""

from __future__ import annotations

from dataclasses import dataclass

# Severity → task priority label.
PRIORITY_BY_SEVERITY = {"error": "P1", "warning": "P2", "notice": "P3"}
PRIORITY_RANK = {"error": 0, "warning": 1, "notice": 2}


@dataclass(frozen=True)
class CategoryKnowledge:
    key: str
    title: str
    severity: str
    business_impact: str
    seo_impact: str
    recommended_fix: str
    acceptance_criteria: str
    #: Fixed set-up effort for the task, in minutes.
    base_minutes: int
    #: Additional effort per affected page/finding, in minutes.
    per_item_minutes: int

    @property
    def priority(self) -> str:
        return PRIORITY_BY_SEVERITY[self.severity]

    def estimated_minutes(self, item_count: int) -> int:
        return self.base_minutes + self.per_item_minutes * max(item_count, 1)


KNOWLEDGE_BASE: dict[str, CategoryKnowledge] = {
    "404Errors": CategoryKnowledge(
        key="404Errors",
        title="Fix 404 (Not Found) pages",
        severity="error",
        business_impact=(
            "Visitors landing on dead pages bounce immediately — wasting paid and "
            "organic acquisition spend and eroding trust in the brand."
        ),
        seo_impact=(
            "404s burn crawl budget, drop previously-indexed pages, and strand any "
            "inbound link equity those URLs had earned."
        ),
        recommended_fix=(
            "Restore the page, or 301-redirect each 404 URL to the most relevant live "
            "page. Update any internal links that still point at the dead URL."
        ),
        acceptance_criteria=(
            "Every listed URL returns HTTP 200, or 301-redirects to a relevant live "
            "page; no internal links resolve to a 404."
        ),
        base_minutes=15,
        per_item_minutes=10,
    ),
    "brokenLinks": CategoryKnowledge(
        key="brokenLinks",
        title="Repair broken internal links",
        severity="error",
        business_impact=(
            "Broken links interrupt the user journey and stall visitors on their way "
            "to converting."
        ),
        seo_impact=(
            "Internal links to 4xx/5xx pages waste crawl budget and send both users "
            "and crawlers into dead ends, weakening site structure."
        ),
        recommended_fix=(
            "Update each internal link to point at a working URL, or remove it if the "
            "target is permanently gone."
        ),
        acceptance_criteria=(
            "No internal link on the site resolves to a 4xx or 5xx status."
        ),
        base_minutes=15,
        per_item_minutes=8,
    ),
    "redirectChains": CategoryKnowledge(
        key="redirectChains",
        title="Collapse redirect chains",
        severity="warning",
        business_impact=(
            "Every extra redirect hop adds latency, increasing bounce rate on mobile "
            "and slow connections."
        ),
        seo_impact=(
            "Redirect chains dilute link equity and waste crawl budget; search "
            "engines may stop following long chains entirely."
        ),
        recommended_fix=(
            "Point each source URL directly at its final destination in a single 301 "
            "hop, removing the intermediate redirects."
        ),
        acceptance_criteria=(
            "Every affected URL resolves in at most one redirect; no multi-hop chains "
            "remain."
        ),
        base_minutes=20,
        per_item_minutes=10,
    ),
    "missingTitles": CategoryKnowledge(
        key="missingTitles",
        title="Add missing <title> tags",
        severity="warning",
        business_impact=(
            "Pages without titles show unhelpful browser-tab labels and search "
            "snippets, lowering click-through from results."
        ),
        seo_impact=(
            "The title tag is a primary on-page ranking signal; a missing title "
            "severely limits a page's ranking potential."
        ),
        recommended_fix=(
            "Add a unique, descriptive <title> of 50–60 characters to each page, "
            "leading with the primary keyword."
        ),
        acceptance_criteria=(
            "Every indexable page has a unique, non-empty title of roughly 50–60 "
            "characters."
        ),
        base_minutes=15,
        per_item_minutes=10,
    ),
    "duplicateTitles": CategoryKnowledge(
        key="duplicateTitles",
        title="Deduplicate title tags",
        severity="warning",
        business_impact=(
            "Duplicate titles confuse users scanning results and split click-through "
            "across competing pages."
        ),
        seo_impact=(
            "Duplicate titles cause keyword cannibalization and make it hard for "
            "search engines to choose the right page to rank."
        ),
        recommended_fix=(
            "Rewrite each duplicated title so it is unique and specific to that "
            "page's content and intent."
        ),
        acceptance_criteria="No two indexable pages share the same title.",
        base_minutes=20,
        per_item_minutes=10,
    ),
    "missingDescriptions": CategoryKnowledge(
        key="missingDescriptions",
        title="Add missing meta descriptions",
        severity="warning",
        business_impact=(
            "Without a meta description, search engines auto-generate the snippet, "
            "reducing click-through versus a written, on-brand summary."
        ),
        seo_impact=(
            "Meta descriptions shape the search snippet and influence CTR, an "
            "indirect ranking factor; missing ones cede that control."
        ),
        recommended_fix=(
            "Write a unique 140–160 character meta description for each page that "
            "summarizes it and includes a call to action."
        ),
        acceptance_criteria=(
            "Every indexable page has a unique meta description of roughly 140–160 "
            "characters."
        ),
        base_minutes=15,
        per_item_minutes=8,
    ),
    "duplicateDescriptions": CategoryKnowledge(
        key="duplicateDescriptions",
        title="Deduplicate meta descriptions",
        severity="warning",
        business_impact=(
            "Repeated snippets across results look low-effort and reduce the pages' "
            "differentiation to searchers."
        ),
        seo_impact=(
            "Duplicate descriptions weaken per-page relevance signals and snippet "
            "quality."
        ),
        recommended_fix=(
            "Write a distinct meta description for each affected page."
        ),
        acceptance_criteria="No two indexable pages share the same meta description.",
        base_minutes=15,
        per_item_minutes=8,
    ),
    "missingH1": CategoryKnowledge(
        key="missingH1",
        title="Add missing H1 headings",
        severity="warning",
        business_impact=(
            "Pages without a clear headline feel disorganized and are harder to read, "
            "especially for assistive-technology users."
        ),
        seo_impact=(
            "The H1 signals the page's primary topic to search engines and screen "
            "readers; missing it weakens on-page relevance."
        ),
        recommended_fix=(
            "Add exactly one descriptive H1 per page that reflects its primary topic."
        ),
        acceptance_criteria=(
            "Every indexable page has exactly one non-empty H1 heading."
        ),
        base_minutes=10,
        per_item_minutes=8,
    ),
    "missingCanonicals": CategoryKnowledge(
        key="missingCanonicals",
        title="Add canonical tags",
        severity="warning",
        business_impact=(
            "Without canonicals, duplicate URL variants compete with each other, "
            "diluting the page's authority."
        ),
        seo_impact=(
            "Missing rel=canonical risks duplicate-content indexing and splits "
            "ranking signals across URL variants."
        ),
        recommended_fix=(
            "Add a self-referencing rel=canonical to each page (or point it at the "
            "preferred variant)."
        ),
        acceptance_criteria=(
            "Every indexable page declares a valid rel=canonical URL."
        ),
        base_minutes=10,
        per_item_minutes=5,
    ),
    "thinContent": CategoryKnowledge(
        key="thinContent",
        title="Expand thin-content pages",
        severity="warning",
        business_impact=(
            "Thin pages give visitors little reason to stay, read, or convert."
        ),
        seo_impact=(
            "Low-word-count pages read as low value and may be filtered from the "
            "index or ranked poorly."
        ),
        recommended_fix=(
            "Expand each page with useful, original content (aim for 300+ words), or "
            "consolidate it into a stronger page and noindex the remainder."
        ),
        acceptance_criteria=(
            "Every indexable page has substantive content above the thin-content "
            "threshold, or is intentionally consolidated / noindexed."
        ),
        base_minutes=45,
        per_item_minutes=30,
    ),
    "missingAltText": CategoryKnowledge(
        key="missingAltText",
        title="Add alt text to images",
        severity="notice",
        business_impact=(
            "Missing alt text hurts accessibility and WCAG/ADA compliance, and shuts "
            "the site out of image-driven discovery."
        ),
        seo_impact=(
            "Alt text helps images rank in image search and reinforces the host "
            "page's topical relevance."
        ),
        recommended_fix=(
            "Add concise, descriptive alt text to every meaningful image; use empty "
            'alt="" for purely decorative images.'
        ),
        acceptance_criteria=(
            'Every content image has descriptive alt text; decorative images use '
            'alt="".'
        ),
        base_minutes=10,
        per_item_minutes=3,
    ),
}
