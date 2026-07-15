export type IssueSeverity = "error" | "warning" | "notice";

export type SeoIssueType =
  | "http_error"
  | "redirect_chain"
  | "duplicate_title"
  | "duplicate_description"
  | "missing_h1"
  | "thin_content"
  | "broken_link"
  | "missing_canonical"
  | "large_image"
  | "missing_alt";

export interface SeoIssue {
  type: SeoIssueType;
  severity: IssueSeverity;
  url: string;
  message: string;
}

/** Severity assigned to each issue type. */
export const ISSUE_SEVERITY: Record<SeoIssueType, IssueSeverity> = {
  http_error: "error",
  broken_link: "error",
  redirect_chain: "warning",
  duplicate_title: "warning",
  duplicate_description: "warning",
  missing_h1: "warning",
  thin_content: "warning",
  missing_canonical: "warning",
  large_image: "warning",
  missing_alt: "notice",
};

export const SEO_ISSUE_TYPES = Object.keys(ISSUE_SEVERITY) as SeoIssueType[];
