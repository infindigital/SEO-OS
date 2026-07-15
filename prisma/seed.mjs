// Demo data seed for local development. Populates ~90 days of daily metrics
// using deterministic formulas (no randomness) so runs are reproducible.
// Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAYS = 90;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);

    const progress = (DAYS - 1 - i) / (DAYS - 1); // 0 (oldest) → 1 (today)
    const weekly = Math.sin((i / 7) * Math.PI * 2);
    const jitter = Math.sin(i);

    const organicTraffic = Math.round(1200 + 900 * progress + 180 * weekly + 60 * jitter);
    const seoScore = clamp(Math.round(62 + 20 * progress + 3 * weekly), 0, 100);
    const openTasks = clamp(Math.round(24 - 10 * progress + 3 * Math.sin(i / 3)), 0, 999);
    const completedTasks = clamp(Math.round(3 + 9 * progress + 2 * weekly), 0, 999);
    const criticalIssues = clamp(Math.round(9 - 7 * progress + Math.sin(i / 2)), 0, 999);
    const monthlyRevenue = Math.round(14000 + 11000 * progress + 400 * weekly);
    const developerProgress = clamp(Math.round(35 + 55 * progress), 0, 100);
    const contentProgress = clamp(Math.round(20 + 68 * progress), 0, 100);

    const values = {
      organicTraffic,
      seoScore,
      openTasks,
      completedTasks,
      criticalIssues,
      monthlyRevenue,
      developerProgress,
      contentProgress,
    };

    await prisma.dailyMetric.upsert({
      where: { date },
      update: values,
      create: { date, ...values },
    });
  }

  console.log(`Seeded ${DAYS} days of daily metrics.`);
  await seedSearchConsole();
}

async function seedSearchConsole() {
  const siteUrl = "https://acme.example/";
  const clientName = "Acme Digital (demo)";

  const existingClient = await prisma.client.findFirst({
    where: { name: clientName },
  });
  const client =
    existingClient ??
    (await prisma.client.create({
      data: {
        name: clientName,
        website: siteUrl,
        contactEmail: "team@acme.example",
        status: "ACTIVE",
      },
    }));

  const connection = await prisma.searchConsoleConnection.upsert({
    where: { clientId_siteUrl: { clientId: client.id, siteUrl } },
    update: { status: "CONNECTED", lastSyncedAt: new Date() },
    create: {
      clientId: client.id,
      siteUrl,
      status: "CONNECTED",
      lastSyncedAt: new Date(),
    },
  });

  const queries = [
    "seo tools",
    "technical seo",
    "keyword research",
    "site audit",
    "backlink checker",
    "core web vitals",
  ];
  const pages = [
    `${siteUrl}`,
    `${siteUrl}blog/technical-seo`,
    `${siteUrl}tools/audit`,
    `${siteUrl}pricing`,
    `${siteUrl}blog/core-web-vitals`,
  ];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const DAYS_OF_DATA = 14;

  for (let d = 0; d < DAYS_OF_DATA; d += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - d - 3);

    for (const [index, query] of queries.entries()) {
      const impressions = 400 - index * 40 + ((d * 7) % 30);
      const clicks = Math.round(impressions * (0.08 - index * 0.008));
      await upsertAnalytics(connection.id, "QUERY", query, date, clicks, impressions, 3 + index * 0.8);
    }
    for (const [index, page] of pages.entries()) {
      const impressions = 500 - index * 60 + ((d * 5) % 25);
      const clicks = Math.round(impressions * (0.1 - index * 0.01));
      await upsertAnalytics(connection.id, "PAGE", page, date, clicks, impressions, 2 + index);
    }
  }

  const coverage = [
    { page: pages[0], state: "Submitted and indexed", verdict: "PASS" },
    { page: pages[1], state: "Submitted and indexed", verdict: "PASS" },
    { page: pages[2], state: "Crawled - currently not indexed", verdict: "NEUTRAL" },
    { page: pages[3], state: "Submitted and indexed", verdict: "PASS" },
    { page: pages[4], state: "Discovered - currently not indexed", verdict: "NEUTRAL" },
  ];
  for (const entry of coverage) {
    await prisma.pageCoverage.upsert({
      where: { connectionId_page: { connectionId: connection.id, page: entry.page } },
      update: { coverageState: entry.state, verdict: entry.verdict },
      create: {
        connectionId: connection.id,
        page: entry.page,
        coverageState: entry.state,
        verdict: entry.verdict,
      },
    });
  }

  console.log(`Seeded Search Console demo data for "${clientName}".`);
}

async function upsertAnalytics(connectionId, dimension, key, date, clicks, impressions, position) {
  const ctr = impressions > 0 ? clicks / impressions : 0;
  await prisma.searchAnalyticsRow.upsert({
    where: {
      connectionId_dimension_keyValue_date: {
        connectionId,
        dimension,
        keyValue: key,
        date,
      },
    },
    update: { clicks, impressions, ctr, position },
    create: { connectionId, dimension, keyValue: key, date, clicks, impressions, ctr, position },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
