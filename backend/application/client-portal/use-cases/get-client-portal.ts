import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import type { SearchConsoleReadRepository } from "@backend/application/dashboards/ports/search-console-read-repository";
import type { DeveloperTaskRepository } from "@backend/application/developer-task/ports/developer-task-repository";
import type { ClientReportRepository } from "@backend/application/client-report/ports/client-report-repository";
import type {
  ClientPortal,
  PortalCompletedWork,
  PortalTimelineItem,
} from "../dto";
import { toPortalReport } from "../mapper";

const TOP_KEYWORDS = 6;
const RECENT_WORK = 6;
const TIMELINE_LIMIT = 8;

/**
 * Assembles the curated, client-facing portal for a client. Draws only
 * client-safe, high-level data — no crawl issues, task internals, or index
 * coverage.
 */
export class GetClientPortal {
  constructor(
    private readonly clients: ClientRepository,
    private readonly read: SearchConsoleReadRepository,
    private readonly tasks: DeveloperTaskRepository,
    private readonly reports: ClientReportRepository,
  ) {}

  async execute(clientId: string): Promise<ClientPortal | null> {
    const client = await this.clients.findById(clientId);
    if (!client) {
      return null;
    }

    const connection = await this.read.getPrimaryConnection(clientId);
    const [traffic, keywords, keywordTotal] = connection
      ? await Promise.all([
          this.read.totals(connection.id, "QUERY"),
          this.read.topRows(connection.id, "QUERY", TOP_KEYWORDS),
          this.read.keywordCount(connection.id),
        ])
      : [{ clicks: 0, impressions: 0, position: 0 }, [], 0];

    const [completed, reports] = await Promise.all([
      this.tasks.list({ clientId, status: "DONE" }),
      this.reports.listByClient(clientId),
    ]);

    const recentWork: PortalCompletedWork[] = completed
      .slice(0, RECENT_WORK)
      .map((task) => ({
        title: task.title,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      }));

    const timeline = buildTimeline({
      onboardedAt: client.createdAt,
      lastReviewAt: client.lastAuditAt,
      completed: completed.map((task) => ({
        title: task.title,
        at: task.completedAt,
      })),
      reports: reports.map((report) => ({
        title: report.title,
        at: report.publishedAt,
      })),
    });

    return {
      client: {
        id: client.id,
        name: client.name,
        website: client.website,
        currentFocus: client.currentFocus,
      },
      seoScore: client.seoScore,
      organicTraffic: { clicks: traffic.clicks, connected: connection !== null },
      keywords: {
        total: keywordTotal,
        top: keywords.map((row) => ({ keyword: row.key, clicks: row.clicks })),
      },
      completedWork: { total: completed.length, recent: recentWork },
      timeline,
      reports: reports.map(toPortalReport),
    };
  }
}

function buildTimeline(input: {
  onboardedAt: Date;
  lastReviewAt: Date | null;
  completed: { title: string; at: Date | null }[];
  reports: { title: string; at: Date }[];
}): PortalTimelineItem[] {
  const items: PortalTimelineItem[] = [
    {
      date: input.onboardedAt.toISOString(),
      label: "Client onboarded",
      kind: "onboarded",
    },
  ];

  if (input.lastReviewAt) {
    items.push({
      date: input.lastReviewAt.toISOString(),
      label: "SEO review completed",
      kind: "review",
    });
  }

  for (const task of input.completed) {
    if (task.at) {
      items.push({
        date: task.at.toISOString(),
        label: `Completed: ${task.title}`,
        kind: "work",
      });
    }
  }

  for (const report of input.reports) {
    items.push({
      date: report.at.toISOString(),
      label: `Report published: ${report.title}`,
      kind: "report",
    });
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, TIMELINE_LIMIT);
}
