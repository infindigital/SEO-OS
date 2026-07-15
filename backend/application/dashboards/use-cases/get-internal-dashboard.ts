import type { Client } from "@backend/domain/client/client";
import type { DailyMetric } from "@backend/domain/metrics/daily-metric";
import type { MetricsRepository } from "@backend/application/metrics/ports/metrics-repository";
import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import type { ProfileRepository } from "@backend/application/auth/ports/profile-repository";
import type {
  ClientGrowthPoint,
  InternalDashboard,
  InternalDashboardCards,
  InternalDashboardQuery,
} from "../dto";

const DEFAULT_RANGE_DAYS = 30;
const AUDIT_STALE_DAYS = 30;
const DAY_MS = 86_400_000;

/**
 * Aggregates the internal (agency operations) dashboard: live portfolio
 * counters drawn from clients and staff, plus historical trend series drawn
 * from the daily metrics snapshots.
 */
export class GetInternalDashboard {
  constructor(
    private readonly metrics: MetricsRepository,
    private readonly clients: ClientRepository,
    private readonly profiles: ProfileRepository,
  ) {}

  async execute(
    query: InternalDashboardQuery = {},
    now: Date = new Date(),
  ): Promise<InternalDashboard> {
    const days = query.days ?? DEFAULT_RANGE_DAYS;

    const [metrics, allClients, profiles] = await Promise.all([
      this.metrics.listRecent(days),
      this.clients.list({ includeArchived: true }),
      this.profiles.list(),
    ]);

    const activeClients = allClients.filter((client) => !client.isArchived);
    const latest = metrics.at(-1) ?? null;

    return {
      rangeDays: days,
      hasData: metrics.length > 0 || allClients.length > 0,
      cards: this.buildCards(activeClients, profiles, latest, now),
      seoHealth: metrics.map((metric) => ({
        date: metric.date.toISOString(),
        score: metric.seoScore,
      })),
      clientGrowth: buildClientGrowth(allClients),
      revenue: metrics.map((metric) => ({
        date: metric.date.toISOString(),
        revenue: metric.monthlyRevenue,
      })),
      taskCompletion: metrics.map((metric) => ({
        date: metric.date.toISOString(),
        open: metric.openTasks,
        completed: metric.completedTasks,
      })),
    };
  }

  private buildCards(
    activeClients: Client[],
    profiles: { role: string }[],
    latest: DailyMetric | null,
    now: Date,
  ): InternalDashboardCards {
    const monthlyRevenue = activeClients.reduce(
      (sum, client) => sum + (client.monthlyRetainer ?? 0),
      0,
    );

    const scored = activeClients.filter((client) => client.seoScore !== null);
    const averageSeoScore =
      scored.length > 0
        ? Math.round(
            scored.reduce((sum, client) => sum + (client.seoScore ?? 0), 0) /
              scored.length,
          )
        : null;

    const staleThreshold = now.getTime() - AUDIT_STALE_DAYS * DAY_MS;
    const reportsPending = activeClients.filter(
      (client) =>
        client.lastAuditAt === null ||
        client.lastAuditAt.getTime() < staleThreshold,
    ).length;

    const activeDevelopers = profiles.filter(
      (profile) => profile.role === "DEVELOPER",
    ).length;

    return {
      totalClients: activeClients.length,
      monthlyRevenue,
      openTasks: latest?.openTasks ?? 0,
      criticalIssues: latest?.criticalIssues ?? 0,
      reportsPending,
      activeDevelopers,
      averageSeoScore,
    };
  }
}

/** Cumulative client acquisition grouped by the month each client was created. */
function buildClientGrowth(clients: Client[]): ClientGrowthPoint[] {
  const addedByMonth = new Map<string, number>();
  for (const client of clients) {
    const key = monthKey(client.createdAt);
    addedByMonth.set(key, (addedByMonth.get(key) ?? 0) + 1);
  }

  let running = 0;
  return [...addedByMonth.keys()]
    .sort()
    .map((month) => {
      const added = addedByMonth.get(month) ?? 0;
      running += added;
      return { month, added, total: running };
    });
}

/** First day of a date's month as an ISO-8601 string (UTC). */
function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01T00:00:00.000Z`;
}
