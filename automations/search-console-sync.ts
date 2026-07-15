import "server-only";

import { searchConsole } from "@backend/infrastructure/container";
import type { SyncAllResult } from "@backend/application/search-console/dto";

/**
 * Automatic Search Console sync.
 *
 * Runs daily at 03:00 UTC. Trigger it by having a scheduler POST/GET the
 * protected endpoint `POST /api/cron/search-console` (Authorization: Bearer
 * <CRON_SECRET>) on this schedule — e.g. a Vercel Cron, a Kubernetes CronJob,
 * or any external scheduler.
 */
export const SEARCH_CONSOLE_SYNC_SCHEDULE = "0 3 * * *";

export async function runSearchConsoleSync(): Promise<SyncAllResult> {
  return searchConsole.syncAll.execute();
}
