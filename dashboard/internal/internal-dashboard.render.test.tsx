import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { InternalDashboard } from "@backend/application/dashboards/dto";
import { InternalDashboardView } from "./components/internal-dashboard";

const dashboard: InternalDashboard = {
  rangeDays: 30,
  hasData: true,
  cards: {
    totalClients: 12,
    monthlyRevenue: 48000,
    openTasks: 14,
    criticalIssues: 3,
    reportsPending: 5,
    activeDevelopers: 4,
    averageSeoScore: 76,
  },
  seoHealth: [
    { date: "2026-07-13T00:00:00.000Z", score: 74 },
    { date: "2026-07-14T00:00:00.000Z", score: 76 },
  ],
  clientGrowth: [
    { month: "2026-06-01T00:00:00.000Z", added: 3, total: 9 },
    { month: "2026-07-01T00:00:00.000Z", added: 3, total: 12 },
  ],
  revenue: [
    { date: "2026-07-13T00:00:00.000Z", revenue: 46000 },
    { date: "2026-07-14T00:00:00.000Z", revenue: 48000 },
  ],
  taskCompletion: [
    { date: "2026-07-13T00:00:00.000Z", open: 15, completed: 9 },
    { date: "2026-07-14T00:00:00.000Z", open: 14, completed: 11 },
  ],
};

describe("InternalDashboardView", () => {
  it("renders every card and chart heading without throwing", () => {
    const html = renderToStaticMarkup(
      <InternalDashboardView dashboard={dashboard} />,
    );

    // Cards.
    expect(html).toContain("Total Clients");
    expect(html).toContain("Monthly Revenue");
    expect(html).toContain("Open Tasks");
    expect(html).toContain("Critical Issues");
    expect(html).toContain("Reports Pending");
    expect(html).toContain("Active Developers");
    expect(html).toContain("Average SEO Score");
    // Formatted values.
    expect(html).toContain("$48,000");
    expect(html).toContain("76");
    // Chart headings.
    expect(html).toContain("SEO Health");
    expect(html).toContain("Client Growth");
    expect(html).toContain("Task Completion");
  });
});
