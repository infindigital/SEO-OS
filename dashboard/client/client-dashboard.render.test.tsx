import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ClientDashboard } from "@backend/application/dashboards/dto";
import { ClientDashboardView } from "./components/client-dashboard";

const client: ClientDashboard["client"] = {
  id: "c1",
  name: "Acme Digital",
  website: "https://acme.example/",
  contactName: null,
  contactEmail: null,
  status: "ACTIVE",
  notes: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("ClientDashboardView", () => {
  it("renders performance, top rows and coverage when connected", () => {
    const dashboard: ClientDashboard = {
      client,
      connection: {
        siteUrl: "https://acme.example/",
        status: "CONNECTED",
        lastSyncedAt: "2026-07-12T00:00:00.000Z",
      },
      totals: { clicks: 1200, impressions: 34000, ctr: 0.035, position: 8.4 },
      topQueries: [{ key: "seo tools", clicks: 200, impressions: 3000, ctr: 0.066, position: 4.2 }],
      topPages: [{ key: "https://acme.example/", clicks: 300, impressions: 5000, ctr: 0.06, position: 3.1 }],
      coverage: [{ state: "Submitted and indexed", count: 12 }],
    };

    const html = renderToStaticMarkup(
      <ClientDashboardView dashboard={dashboard} />,
    );
    expect(html).toContain("Acme Digital");
    expect(html).toContain("Top queries");
    expect(html).toContain("seo tools");
    expect(html).toContain("Top pages");
    expect(html).toContain("Index coverage");
    expect(html).toContain("Submitted and indexed");
  });

  it("renders an empty state when there is no connection", () => {
    const dashboard: ClientDashboard = {
      client,
      connection: null,
      totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      topQueries: [],
      topPages: [],
      coverage: [],
    };

    const html = renderToStaticMarkup(
      <ClientDashboardView dashboard={dashboard} />,
    );
    expect(html).toContain("No Search Console connection");
  });
});
