/**
 * Read model for a single day's headline metrics. This is a query-side record
 * (no behaviour), mapped straight from the `daily_metrics` table.
 */
export interface DailyMetric {
  id: string;
  date: Date;
  organicTraffic: number;
  seoScore: number;
  openTasks: number;
  completedTasks: number;
  criticalIssues: number;
  monthlyRevenue: number;
  developerProgress: number;
  contentProgress: number;
  createdAt: Date;
  updatedAt: Date;
}
