import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ClientPortal } from "@backend/application/client-portal/dto";
import { PortalStatCards } from "./components/portal-stat-cards";

const portal: ClientPortal = {
  client: { id: "c1", name: "Acme", website: "https://acme.com/", currentFocus: "CWV" },
  seoScore: 78,
  organicTraffic: { clicks: 1234, connected: true },
  keywords: { total: 42, top: [{ keyword: "seo", clicks: 300 }] },
  completedWork: { total: 5, recent: [{ title: "Fix 404s", completedAt: null }] },
  timeline: [{ date: "2026-07-01T00:00:00.000Z", label: "Onboarded", kind: "onboarded" }],
  reports: [],
};

describe("PortalStatCards", () => {
  it("renders the four client-facing KPIs with values", () => {
    const html = renderToStaticMarkup(<PortalStatCards portal={portal} />);

    expect(html).toContain("SEO Score");
    expect(html).toContain("78");
    expect(html).toContain("Organic Traffic");
    expect(html).toContain("1,234");
    expect(html).toContain("Keywords");
    expect(html).toContain("42");
    expect(html).toContain("Completed Work");
    expect(html).toContain("Clicks from search");
  });

  it("shows a not-connected hint when Search Console is absent", () => {
    const html = renderToStaticMarkup(
      <PortalStatCards
        portal={{ ...portal, organicTraffic: { clicks: 0, connected: false } }}
      />,
    );
    expect(html).toContain("Not connected yet");
  });
});
