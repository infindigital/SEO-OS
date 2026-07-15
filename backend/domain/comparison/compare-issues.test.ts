import { describe, expect, it } from "vitest";

import type { SeoIssue } from "../analysis/issue";
import { compareIssues, improvementScore } from "./compare-issues";

function issue(
  type: SeoIssue["type"],
  url: string,
  severity: SeoIssue["severity"],
): SeoIssue {
  return { type, url, severity, message: "" };
}

describe("compareIssues", () => {
  it("splits issues into new, resolved and remaining", () => {
    const previous = [
      issue("http_error", "https://s/a", "error"),
      issue("missing_alt", "https://s/b", "notice"),
      issue("duplicate_title", "https://s/c", "warning"),
    ];
    const current = [
      issue("duplicate_title", "https://s/c", "warning"), // remaining
      issue("thin_content", "https://s/d", "warning"), // new
    ];

    const result = compareIssues(previous, current);

    expect(result.newIssues.map((i) => i.url)).toEqual(["https://s/d"]);
    expect(result.remainingIssues.map((i) => i.url)).toEqual(["https://s/c"]);
    expect(result.resolvedIssues.map((i) => i.url).sort()).toEqual([
      "https://s/a",
      "https://s/b",
    ]);
    expect(result.counts).toEqual({
      newIssues: 1,
      resolvedIssues: 2,
      remainingIssues: 1,
      previousTotal: 3,
      currentTotal: 2,
    });
  });
});

describe("improvementScore", () => {
  it("is positive when the weighted burden decreases", () => {
    const previous = [
      issue("http_error", "https://s/a", "error"), // 3
      issue("duplicate_title", "https://s/c", "warning"), // 2
      issue("missing_alt", "https://s/b", "notice"), // 1 => total 6
    ];
    const current = [issue("duplicate_title", "https://s/c", "warning")]; // 2
    expect(improvementScore(previous, current)).toBe(67); // (6-2)/6
  });

  it("is 100 when all issues are resolved", () => {
    const previous = [issue("http_error", "https://s/a", "error")];
    expect(improvementScore(previous, [])).toBe(100);
  });

  it("is -100 when a previously clean site regresses", () => {
    const current = [issue("http_error", "https://s/a", "error")];
    expect(improvementScore([], current)).toBe(-100);
  });

  it("is 0 when both are clean", () => {
    expect(improvementScore([], [])).toBe(0);
  });
});
