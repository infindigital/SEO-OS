import { beforeEach, describe, expect, it } from "vitest";

import { InMemorySearchConsoleRepository } from "@backend/infrastructure/search-console/in-memory-search-console-repository";
import { SyncSearchConsole } from "./use-cases/sync-search-console";
import { SearchConsoleNotConnectedError } from "./errors";
import type {
  AnalyticsQuery,
  GscAnalyticsRow,
  GscCoverageRow,
  SearchConsoleGateway,
} from "./ports/search-console-gateway";
import type { SearchConsoleGatewayFactory } from "./ports/search-console-gateway-factory";

class FakeGateway implements SearchConsoleGateway {
  readonly inspected: string[] = [];
  constructor(
    private readonly queryRows: GscAnalyticsRow[],
    private readonly pageRows: GscAnalyticsRow[],
  ) {}

  async fetchAnalytics(query: AnalyticsQuery): Promise<GscAnalyticsRow[]> {
    return query.dimension === "QUERY" ? this.queryRows : this.pageRows;
  }

  async inspectUrl(_siteUrl: string, page: string): Promise<GscCoverageRow> {
    this.inspected.push(page);
    return {
      page,
      coverageState: "Submitted and indexed",
      verdict: "PASS",
      lastCrawledAt: null,
    };
  }
}

function row(key: string, clicks: number): GscAnalyticsRow {
  return {
    date: "2026-07-01",
    key,
    clicks,
    impressions: clicks * 10,
    ctr: 0.1,
    position: 2,
  };
}

describe("SyncSearchConsole", () => {
  let repository: InMemorySearchConsoleRepository;
  let gateway: FakeGateway;
  let factory: SearchConsoleGatewayFactory;

  beforeEach(() => {
    repository = new InMemorySearchConsoleRepository();
    gateway = new FakeGateway(
      [row("seo", 5), row("tools", 3)],
      [row("https://s/a", 9), row("https://s/b", 1)],
    );
    factory = { create: () => gateway };
  });

  it("syncs analytics and coverage and marks the connection synced", async () => {
    repository.seed({
      id: "c1",
      clientId: "client",
      siteUrl: "https://s/",
      refreshToken: "rt",
      status: "CONNECTED",
      lastSyncedAt: null,
    });

    const result = await new SyncSearchConsole(repository, factory).execute("c1");

    expect(result.queryRows).toBe(2);
    expect(result.pageRows).toBe(2);
    expect(result.coverageRows).toBe(2);
    // Coverage inspected the top pages by clicks (a before b).
    expect(gateway.inspected).toEqual(["https://s/a", "https://s/b"]);
    expect(repository.analyticsRows.get("c1")).toHaveLength(4);

    const connection = await repository.getConnection("c1");
    expect(connection?.lastSyncedAt).not.toBeNull();
  });

  it("throws when the connection has no stored credentials", async () => {
    repository.seed({
      id: "c2",
      clientId: "client",
      siteUrl: "https://s/",
      refreshToken: null,
      status: "CONNECTED",
      lastSyncedAt: null,
    });

    await expect(
      new SyncSearchConsole(repository, factory).execute("c2"),
    ).rejects.toBeInstanceOf(SearchConsoleNotConnectedError);
  });

  it("limits coverage inspection to the top pages", async () => {
    repository.seed({
      id: "c3",
      clientId: "client",
      siteUrl: "https://s/",
      refreshToken: "rt",
      status: "CONNECTED",
      lastSyncedAt: null,
    });

    await new SyncSearchConsole(repository, factory).execute("c3", {
      coverageLimit: 1,
    });

    expect(gateway.inspected).toEqual(["https://s/a"]);
  });
});
