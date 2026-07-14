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
    const developerProgress = clamp(Math.round(35 + 55 * progress), 0, 100);
    const contentProgress = clamp(Math.round(20 + 68 * progress), 0, 100);

    await prisma.dailyMetric.upsert({
      where: { date },
      update: {
        organicTraffic,
        seoScore,
        openTasks,
        developerProgress,
        contentProgress,
      },
      create: {
        date,
        organicTraffic,
        seoScore,
        openTasks,
        developerProgress,
        contentProgress,
      },
    });
  }

  console.log(`Seeded ${DAYS} days of daily metrics.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
