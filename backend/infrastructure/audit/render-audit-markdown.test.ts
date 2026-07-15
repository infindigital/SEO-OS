import { describe, expect, it } from "vitest";

import { buildAudit } from "../../domain/audit/generate-audit";
import type { SeoIssue } from "../../domain/analysis/issue";
import type { TechnicalAudit } from "../../domain/audit/technical-audit";
import { renderAuditMarkdown } from "./render-audit-markdown";

function audit(issues: SeoIssue[]): TechnicalAudit {
  const { tasks, summary } = buildAudit(issues);
  return {
    startUrl: "https://s/",
    host: "s",
    generatedAt: "2026-07-15T00:00:00.000Z",
    summary,
    tasks,
  };
}

describe("renderAuditMarkdown", () => {
  it("renders headings, summary and task sections", () => {
    const markdown = renderAuditMarkdown(
      audit([
        { type: "http_error", severity: "error", url: "https://s/a", message: "" },
        { type: "missing_alt", severity: "notice", url: "https://s/b", message: "" },
      ]),
    );

    expect(markdown).toContain("# Technical SEO Audit — s");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("## Developer tasks");
    expect(markdown).toContain("Fix pages returning HTTP errors");
    expect(markdown).toContain("**Business impact:**");
    expect(markdown).toContain("**SEO impact:**");
    expect(markdown).toContain("**Recommended fix:**");
    expect(markdown).toContain("**Acceptance criteria:**");
    expect(markdown).toContain("- [ ] ");
    expect(markdown).toContain("https://s/a");
  });

  it("renders a clean message when there are no issues", () => {
    const markdown = renderAuditMarkdown(audit([]));
    expect(markdown).toContain("No issues found");
    expect(markdown).not.toContain("## Developer tasks");
  });
});
