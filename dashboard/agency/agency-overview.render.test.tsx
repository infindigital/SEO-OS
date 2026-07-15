import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { AgencyOverview } from "@backend/application/dashboards/dto";
import { AgencyOverviewView } from "./components/agency-overview";

const overview: AgencyOverview = {
  clientCount: 2,
  connectedCount: 1,
  totals: { clicks: 1200, impressions: 34000, ctr: 0.035 },
  clients: [
    {
      client: {
        id: "c1",
        name: "Acme Digital",
        website: "https://acme.example/",
        contactName: null,
        contactEmail: null,
        status: "ACTIVE",
        ownerId: null,
        industry: null,
        monthlyRetainer: null,
        seoScore: null,
        lastAuditAt: null,
        currentFocus: null,
        notes: null,
        archivedAt: null,
        isArchived: false,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
      gsc: {
        siteUrl: "https://acme.example/",
        status: "CONNECTED",
        lastSyncedAt: "2026-07-12T00:00:00.000Z",
        clicks: 1200,
        impressions: 34000,
        ctr: 0.035,
      },
    },
    {
      client: {
        id: "c2",
        name: "Globex",
        website: null,
        contactName: null,
        contactEmail: null,
        status: "PROSPECT",
        ownerId: null,
        industry: null,
        monthlyRetainer: null,
        seoScore: null,
        lastAuditAt: null,
        currentFocus: null,
        notes: null,
        archivedAt: null,
        isArchived: false,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
      gsc: null,
    },
  ],
};

describe("AgencyOverviewView", () => {
  it("renders the portfolio table and totals", () => {
    const html = renderToStaticMarkup(
      <AgencyOverviewView overview={overview} />,
    );
    expect(html).toContain("Agency dashboard");
    expect(html).toContain("Acme Digital");
    expect(html).toContain("/clients/c1");
    expect(html).toContain("Globex");
    expect(html).toContain("Search Console not connected");
  });
});
