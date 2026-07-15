import type { SeoIssueType } from "../analysis/issue";
import type { Priority } from "./priority";

export type TaskCategory = "development" | "content";

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  development: "Development",
  content: "Content",
};

export interface RemediationPlaybookEntry {
  title: string;
  category: TaskCategory;
  priority: Priority;
  businessImpact: string;
  seoImpact: string;
  recommendedFix: string;
  /** Fixed effort for the task regardless of occurrence count. */
  baseMinutes: number;
  /** Additional effort per affected page beyond the first. */
  perOccurrenceMinutes: number;
  acceptanceCriteria: string[];
}

/**
 * SEO remediation knowledge: how each detected issue type maps to a developer
 * task, its impact, the recommended fix, effort, and acceptance criteria.
 */
export const REMEDIATION_PLAYBOOK: Record<SeoIssueType, RemediationPlaybookEntry> =
  {
    http_error: {
      title: "Fix pages returning HTTP errors",
      category: "development",
      priority: "critical",
      businessImpact:
        "Error pages lose visitors and conversions and erode trust in the brand.",
      seoImpact:
        "Search engines drop error URLs from the index and waste crawl budget on them.",
      recommendedFix:
        "Restore the page to return 200, or 301-redirect the URL to the most relevant equivalent, and remove internal links pointing to it.",
      baseMinutes: 30,
      perOccurrenceMinutes: 15,
      acceptanceCriteria: [
        "Every affected URL returns HTTP 200 or a single 301 to a relevant page.",
        "No internal links point to error URLs.",
        "A follow-up crawl reports zero HTTP errors for these URLs.",
      ],
    },
    broken_link: {
      title: "Fix broken internal links",
      category: "development",
      priority: "high",
      businessImpact:
        "Broken links frustrate users and dead-end their journey through the site.",
      seoImpact:
        "They waste crawl budget and pass no link equity to their targets.",
      recommendedFix:
        "Update each broken link to point at the correct live URL, or remove it if no equivalent exists.",
      baseMinutes: 20,
      perOccurrenceMinutes: 10,
      acceptanceCriteria: [
        "Every internal link resolves to an HTTP 200 page.",
        "A re-crawl finds no broken internal links.",
      ],
    },
    redirect_chain: {
      title: "Flatten redirect chains",
      category: "development",
      priority: "medium",
      businessImpact:
        "Each extra hop slows page loads, hurting UX and mobile performance.",
      seoImpact:
        "Multiple redirects dilute link equity and waste crawl budget.",
      recommendedFix:
        "Update links and redirect rules so each source reaches its destination in a single hop.",
      baseMinutes: 20,
      perOccurrenceMinutes: 10,
      acceptanceCriteria: [
        "Each affected URL reaches its destination in at most one redirect.",
        "Internal links target final URLs directly.",
      ],
    },
    duplicate_title: {
      title: "Make page titles unique",
      category: "content",
      priority: "high",
      businessImpact:
        "Duplicate titles confuse users in search results and lower click-through.",
      seoImpact:
        "Duplicate titles cause keyword cannibalization and unclear relevance signals.",
      recommendedFix:
        "Write a unique, descriptive title tag of 50–60 characters for each affected page.",
      baseMinutes: 15,
      perOccurrenceMinutes: 10,
      acceptanceCriteria: [
        "Every affected page has a unique title tag.",
        "Titles are 50–60 characters and describe the page.",
      ],
    },
    duplicate_description: {
      title: "Write unique meta descriptions",
      category: "content",
      priority: "medium",
      businessImpact:
        "Generic descriptions reduce the click-through rate from search results.",
      seoImpact:
        "Duplicate descriptions weaken snippet relevance for each page.",
      recommendedFix:
        "Author a unique meta description of 120–160 characters for each affected page.",
      baseMinutes: 10,
      perOccurrenceMinutes: 8,
      acceptanceCriteria: [
        "Each affected page has a unique meta description of 120–160 characters.",
      ],
    },
    missing_h1: {
      title: "Add a primary H1 to each page",
      category: "content",
      priority: "medium",
      businessImpact:
        "A clear headline orients visitors and improves readability.",
      seoImpact: "The H1 is a strong on-page signal of a page's primary topic.",
      recommendedFix:
        "Add exactly one descriptive H1 that reflects each page's primary topic.",
      baseMinutes: 10,
      perOccurrenceMinutes: 8,
      acceptanceCriteria: [
        "Each affected page has exactly one H1.",
        "The H1 describes the page's primary topic.",
      ],
    },
    thin_content: {
      title: "Expand thin content",
      category: "content",
      priority: "medium",
      businessImpact:
        "Thin pages rarely satisfy user intent and convert poorly.",
      seoImpact:
        "Low-value pages struggle to rank and can drag down overall site quality.",
      recommendedFix:
        "Expand each page with useful, original content above the word-count threshold, or consolidate/noindex it if it has no standalone purpose.",
      baseMinutes: 60,
      perOccurrenceMinutes: 45,
      acceptanceCriteria: [
        "Each affected page exceeds the content threshold with useful content, or is intentionally consolidated or noindexed.",
      ],
    },
    missing_canonical: {
      title: "Add canonical tags",
      category: "development",
      priority: "low",
      businessImpact:
        "Canonicals stop duplicate URLs from competing and splitting signals.",
      seoImpact: "They consolidate ranking signals onto the preferred URL.",
      recommendedFix:
        "Add a self-referencing canonical link tag (or point to the preferred URL) on each affected page.",
      baseMinutes: 10,
      perOccurrenceMinutes: 5,
      acceptanceCriteria: [
        "Each affected page has a valid canonical URL.",
        "Canonical targets resolve to HTTP 200 pages.",
      ],
    },
    large_image: {
      title: "Optimize large images",
      category: "development",
      priority: "medium",
      businessImpact:
        "Heavy images slow pages and increase bounce, especially on mobile.",
      seoImpact: "Page speed and Core Web Vitals are ranking factors.",
      recommendedFix:
        "Compress and resize the flagged images, serve modern formats (WebP/AVIF), and lazy-load below-the-fold images.",
      baseMinutes: 20,
      perOccurrenceMinutes: 10,
      acceptanceCriteria: [
        "Each flagged image is below the size threshold.",
        "Images are served in a modern format at appropriate dimensions.",
      ],
    },
    missing_alt: {
      title: "Add alt text to images",
      category: "content",
      priority: "low",
      businessImpact:
        "Alt text improves accessibility and supports legal compliance.",
      seoImpact:
        "Alt text provides context to search engines and enables image search traffic.",
      recommendedFix:
        "Add concise, descriptive alt text to each content image; use an empty alt attribute for decorative images.",
      baseMinutes: 10,
      perOccurrenceMinutes: 5,
      acceptanceCriteria: [
        "Every content image has descriptive alt text.",
        "Decorative images use an empty alt attribute.",
      ],
    },
  };
