import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { DashboardOverview } from "@backend/application/metrics/dto";
import { DashboardOverviewView } from "./components/dashboard-overview";

const overview: DashboardOverview = {
  rangeDays: 30,
  hasData: true,
  traffic: {
    current: 2100,
    total: 90_000,
    trend: { delta: 50, percentage: 2.4, direction: "up" },
    series: [
      { date: "2026-07-13T00:00:00.000Z", visitors: 2000 },
      { date: "2026-07-14T00:00:00.000Z", visitors: 2100 },
    ],
  },
  seoScore: {
    value: 82,
    trend: { delta: 2, percentage: 2.5, direction: "up" },
  },
  openTasks: {
    value: 14,
    trend: { delta: -1, percentage: -6.6, direction: "down" },
    series: [
      { date: "2026-07-13T00:00:00.000Z", open: 15 },
      { date: "2026-07-14T00:00:00.000Z", open: 14 },
    ],
  },
  developerProgress: 90,
  contentProgress: 88,
};

describe("DashboardOverviewView", () => {
  it("renders every card to markup without throwing", () => {
    const html = renderToStaticMarkup(
      <DashboardOverviewView overview={overview} email="user@example.com" />,
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain("Traffic");
    expect(html).toContain("SEO Score");
    expect(html).toContain("Open Tasks");
    expect(html).toContain("Developer Progress");
    expect(html).toContain("Content Progress");
    // Traffic headline value is formatted and rendered.
    expect(html).toContain("2,100");
  });
});
