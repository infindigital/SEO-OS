import { describe, expect, it } from "vitest";

import { ClientReport, InvalidReportTitleError } from "./client-report";

describe("ClientReport entity", () => {
  it("creates a report with normalized fields", () => {
    const report = ClientReport.create({
      id: "r1",
      clientId: "c1",
      title: "  June report  ",
      period: " June 2026 ",
      summary: "   ",
      url: "https://x/r.pdf",
    });

    expect(report.title).toBe("June report");
    expect(report.period).toBe("June 2026");
    expect(report.summary).toBeNull(); // blank → null
    expect(report.url).toBe("https://x/r.pdf");
    expect(report.publishedAt).toBeInstanceOf(Date);
  });

  it("rejects a blank title", () => {
    expect(() =>
      ClientReport.create({ id: "r1", clientId: "c1", title: "   " }),
    ).toThrow(InvalidReportTitleError);
  });
});
