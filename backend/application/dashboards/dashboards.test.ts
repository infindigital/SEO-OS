import { beforeEach, describe, expect, it } from "vitest";

import { Client } from "@backend/domain/client/client";
import { InMemoryClientRepository } from "@backend/infrastructure/client/in-memory-client-repository";
import { GetAgencyOverview } from "./use-cases/get-agency-overview";
import { GetClientDashboard } from "./use-cases/get-client-dashboard";
import type {
  AggregatedRow,
  ClientMetricSummary,
  ConnectionRef,
  CoverageCount,
  MetricTotals,
  SearchConsoleReadRepository,
} from "./ports/search-console-read-repository";

class FakeReadRepository implements SearchConsoleReadRepository {
  constructor(
    private readonly opts: {
      summaries?: ClientMetricSummary[];
      connection?: ConnectionRef | null;
      totals?: MetricTotals;
      rows?: AggregatedRow[];
      coverage?: CoverageCount[];
    } = {},
  ) {}

  async getClientMetricSummaries(): Promise<ClientMetricSummary[]> {
    return this.opts.summaries ?? [];
  }
  async getPrimaryConnection(): Promise<ConnectionRef | null> {
    return this.opts.connection ?? null;
  }
  async totals(): Promise<MetricTotals> {
    return this.opts.totals ?? { clicks: 0, impressions: 0, position: 0 };
  }
  async topRows(): Promise<AggregatedRow[]> {
    return this.opts.rows ?? [];
  }
  async coverageBreakdown(): Promise<CoverageCount[]> {
    return this.opts.coverage ?? [];
  }
}

describe("GetAgencyOverview", () => {
  it("lists clients with their GSC summaries and agency totals", async () => {
    const clients = new InMemoryClientRepository();
    await clients.create(Client.create({ id: "c1", name: "Acme", status: "ACTIVE" }));
    await clients.create(
      Client.create({ id: "c2", name: "Globex", status: "PROSPECT" }),
    );

    const read = new FakeReadRepository({
      summaries: [
        {
          clientId: "c1",
          siteUrl: "https://acme/",
          status: "CONNECTED",
          lastSyncedAt: new Date("2026-07-10T00:00:00.000Z"),
          clicks: 100,
          impressions: 1000,
        },
      ],
    });

    const overview = await new GetAgencyOverview(clients, read).execute();

    expect(overview.clientCount).toBe(2);
    expect(overview.connectedCount).toBe(1);
    expect(overview.totals).toEqual({ clicks: 100, impressions: 1000, ctr: 0.1 });
    expect(overview.clients.find((r) => r.client.id === "c1")?.gsc?.ctr).toBe(0.1);
    expect(overview.clients.find((r) => r.client.id === "c2")?.gsc).toBeNull();
  });
});

describe("GetClientDashboard", () => {
  let clients: InMemoryClientRepository;

  beforeEach(async () => {
    clients = new InMemoryClientRepository();
    await clients.create(Client.create({ id: "c1", name: "Acme" }));
  });

  it("returns null for a missing client", async () => {
    const result = await new GetClientDashboard(
      clients,
      new FakeReadRepository(),
    ).execute("missing");
    expect(result).toBeNull();
  });

  it("returns an empty dashboard when the client has no connection", async () => {
    const result = await new GetClientDashboard(
      clients,
      new FakeReadRepository(),
    ).execute("c1");
    expect(result?.connection).toBeNull();
    expect(result?.topQueries).toEqual([]);
    expect(result?.totals.ctr).toBe(0);
  });

  it("aggregates connection data with computed CTR", async () => {
    const read = new FakeReadRepository({
      connection: {
        id: "conn1",
        siteUrl: "https://acme/",
        status: "CONNECTED",
        lastSyncedAt: null,
      },
      totals: { clicks: 100, impressions: 1000, position: 3.2 },
      rows: [{ key: "seo", clicks: 20, impressions: 100, position: 2 }],
      coverage: [{ state: "Submitted and indexed", count: 3 }],
    });

    const result = await new GetClientDashboard(clients, read).execute("c1");

    expect(result?.connection?.siteUrl).toBe("https://acme/");
    expect(result?.totals.ctr).toBeCloseTo(0.1);
    expect(result?.topQueries[0].ctr).toBeCloseTo(0.2);
    expect(result?.coverage).toEqual([{ state: "Submitted and indexed", count: 3 }]);
  });
});
