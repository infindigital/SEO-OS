import { describe, expect, it } from "vitest";

import type { SeoIssue } from "../analysis/issue";
import { buildAudit, formatMinutes } from "./generate-audit";
import { REMEDIATION_PLAYBOOK } from "./playbook";

function issue(type: SeoIssue["type"], url: string): SeoIssue {
  return { type, severity: "warning", url, message: "" };
}

describe("formatMinutes", () => {
  it("formats minutes, hours, and combinations", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(150)).toBe("2h 30m");
  });
});

describe("buildAudit", () => {
  const issues: SeoIssue[] = [
    issue("http_error", "https://s/a"),
    issue("broken_link", "https://s/b"),
    issue("missing_alt", "https://s/c"),
    issue("missing_alt", "https://s/c"), // duplicate URL, same type
    issue("duplicate_title", "https://s/d"),
    issue("duplicate_title", "https://s/e"),
  ];

  it("creates one task per issue type", () => {
    const { tasks } = buildAudit(issues);
    expect(tasks.map((task) => task.issueType).sort()).toEqual([
      "broken_link",
      "duplicate_title",
      "http_error",
      "missing_alt",
    ]);
  });

  it("orders tasks by priority then occurrences", () => {
    const { tasks } = buildAudit(issues);
    // critical first, then the two 'high' tasks by occurrences desc, then 'low'.
    expect(tasks.map((task) => task.issueType)).toEqual([
      "http_error", // critical
      "duplicate_title", // high, 2 occurrences
      "broken_link", // high, 1 occurrence
      "missing_alt", // low
    ]);
  });

  it("counts occurrences and de-duplicates affected URLs", () => {
    const { tasks } = buildAudit(issues);
    const missingAlt = tasks.find((task) => task.issueType === "missing_alt")!;
    expect(missingAlt.occurrences).toBe(2);
    expect(missingAlt.affectedUrls).toEqual(["https://s/c"]);
  });

  it("estimates effort from the playbook", () => {
    const { tasks } = buildAudit(issues);
    const httpError = tasks.find((task) => task.issueType === "http_error")!;
    // single occurrence => base minutes only
    expect(httpError.estimatedTimeMinutes).toBe(
      REMEDIATION_PLAYBOOK.http_error.baseMinutes,
    );

    const duplicateTitle = tasks.find(
      (task) => task.issueType === "duplicate_title",
    )!;
    const entry = REMEDIATION_PLAYBOOK.duplicate_title;
    // two occurrences => base + one per-occurrence increment
    expect(duplicateTitle.estimatedTimeMinutes).toBe(
      entry.baseMinutes + entry.perOccurrenceMinutes,
    );
  });

  it("carries impact, fix and acceptance criteria from the playbook", () => {
    const { tasks } = buildAudit([issue("large_image", "https://s/x")]);
    const task = tasks[0];
    expect(task.businessImpact).toBe(
      REMEDIATION_PLAYBOOK.large_image.businessImpact,
    );
    expect(task.seoImpact).toBe(REMEDIATION_PLAYBOOK.large_image.seoImpact);
    expect(task.recommendedFix).toBe(
      REMEDIATION_PLAYBOOK.large_image.recommendedFix,
    );
    expect(task.acceptanceCriteria.length).toBeGreaterThan(0);
  });

  it("summarizes totals and priority counts", () => {
    const { summary, tasks } = buildAudit(issues);
    expect(summary.totalIssues).toBe(6);
    expect(summary.totalTasks).toBe(4);
    expect(summary.byPriority).toEqual({
      critical: 1,
      high: 2,
      medium: 0,
      low: 1,
    });
    const expectedMinutes = tasks.reduce(
      (sum, task) => sum + task.estimatedTimeMinutes,
      0,
    );
    expect(summary.totalEstimatedMinutes).toBe(expectedMinutes);
    expect(summary.estimatedTime).toBe(formatMinutes(expectedMinutes));
  });

  it("returns an empty audit for no issues", () => {
    const { tasks, summary } = buildAudit([]);
    expect(tasks).toEqual([]);
    expect(summary.totalTasks).toBe(0);
    expect(summary.estimatedTime).toBe("0m");
  });
});
