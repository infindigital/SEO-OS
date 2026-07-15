import { beforeEach, describe, expect, it } from "vitest";

import { Client } from "@backend/domain/client/client";
import { DeveloperTask } from "@backend/domain/developer-task/developer-task";
import { InMemoryClientRepository } from "@backend/infrastructure/client/in-memory-client-repository";
import { InMemoryDeveloperTaskRepository } from "@backend/infrastructure/developer-task/in-memory-developer-task-repository";
import { InMemoryClientReportRepository } from "@backend/infrastructure/client-report/in-memory-client-report-repository";
import type {
  AggregatedRow,
  ConnectionRef,
  CoverageCount,
  MetricTotals,
  SearchConsoleReadRepository,
} from "@backend/application/dashboards/ports/search-console-read-repository";
import type { IdGenerator } from "@backend/application/client/ports/id-generator";
import { ClientNotFoundError } from "@backend/application/client/client.errors";
import { GetClientPortal } from "./use-cases/get-client-portal";
import { PublishClientReport } from "./use-cases/publish-report";
import { ResolveClientForEmail } from "./use-cases/resolve-client-for-email";

class FakeReadRepository implements SearchConsoleReadRepository {
  constructor(
    private readonly opts: {
      connection?: ConnectionRef | null;
      totals?: MetricTotals;
      rows?: AggregatedRow[];
      keywords?: number;
    } = {},
  ) {}
  async getClientMetricSummaries() {
    return [];
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
    return [];
  }
  async keywordCount(): Promise<number> {
    return this.opts.keywords ?? 0;
  }
}

class SequentialIds implements IdGenerator {
  private count = 0;
  generate() {
    this.count += 1;
    return `id-${this.count}`;
  }
}

const CONNECTION: ConnectionRef = {
  id: "conn-1",
  siteUrl: "https://acme.example/",
  status: "CONNECTED",
  lastSyncedAt: null,
};

describe("Client portal use cases", () => {
  let clients: InMemoryClientRepository;
  let tasks: InMemoryDeveloperTaskRepository;
  let reports: InMemoryClientReportRepository;

  beforeEach(async () => {
    clients = new InMemoryClientRepository();
    tasks = new InMemoryDeveloperTaskRepository();
    reports = new InMemoryClientReportRepository();

    await clients.create(
      Client.create({
        id: "c1",
        name: "Acme",
        website: "acme.com",
        contactEmail: "team@acme.com",
        seoScore: 78,
        currentFocus: "Core Web Vitals",
        lastAuditAt: new Date("2026-07-01T00:00:00.000Z"),
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
      }),
    );
  });

  it("assembles a curated portal for a client", async () => {
    const done = DeveloperTask.create({
      id: "t1",
      title: "Fix 404s",
      status: "DONE",
      clientId: "c1",
    });
    await tasks.create(done);

    const read = new FakeReadRepository({
      connection: CONNECTION,
      totals: { clicks: 1200, impressions: 40000, position: 8 },
      rows: [
        { key: "seo platform", clicks: 300, impressions: 5000, position: 3 },
        { key: "enterprise seo", clicks: 150, impressions: 3000, position: 6 },
      ],
      keywords: 42,
    });

    const portal = await new GetClientPortal(clients, read, tasks, reports).execute("c1");

    expect(portal).not.toBeNull();
    expect(portal!.client.name).toBe("Acme");
    expect(portal!.client.currentFocus).toBe("Core Web Vitals");
    expect(portal!.seoScore).toBe(78);
    expect(portal!.organicTraffic).toEqual({ clicks: 1200, connected: true });
    expect(portal!.keywords.total).toBe(42);
    expect(portal!.keywords.top[0]).toEqual({ keyword: "seo platform", clicks: 300 });
    expect(portal!.completedWork.total).toBe(1);
    expect(portal!.completedWork.recent[0].title).toBe("Fix 404s");
    // Timeline includes onboarding, SEO review, and completed work, newest first.
    expect(portal!.timeline.length).toBeGreaterThanOrEqual(3);
    expect(portal!.timeline.some((i) => i.kind === "onboarded")).toBe(true);
    expect(portal!.timeline.some((i) => i.kind === "work")).toBe(true);
  });

  it("handles a client with no Search Console connection", async () => {
    const read = new FakeReadRepository({ connection: null });
    const portal = await new GetClientPortal(clients, read, tasks, reports).execute("c1");
    expect(portal!.organicTraffic).toEqual({ clicks: 0, connected: false });
    expect(portal!.keywords.total).toBe(0);
  });

  it("returns null for an unknown client", async () => {
    const read = new FakeReadRepository();
    const portal = await new GetClientPortal(clients, read, tasks, reports).execute("missing");
    expect(portal).toBeNull();
  });

  it("resolves a client by contact email", async () => {
    const resolve = new ResolveClientForEmail(clients);
    expect(await resolve.execute("team@acme.com")).toEqual({ id: "c1", name: "Acme" });
    expect(await resolve.execute("TEAM@ACME.COM")).toEqual({ id: "c1", name: "Acme" });
    expect(await resolve.execute("nobody@example.com")).toBeNull();
  });

  it("publishes a report and lists it, and rejects an unknown client", async () => {
    const publish = new PublishClientReport(clients, reports, new SequentialIds());

    const view = await publish.execute({
      clientId: "c1",
      title: "July report",
      period: "July 2026",
    });
    expect(view.title).toBe("July report");
    expect(await reports.listByClient("c1")).toHaveLength(1);

    await expect(
      publish.execute({ clientId: "missing", title: "x" }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });
});
