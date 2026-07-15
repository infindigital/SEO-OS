-- AlterTable
ALTER TABLE "daily_metrics" ADD COLUMN     "completed_tasks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "critical_issues" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthly_revenue" INTEGER NOT NULL DEFAULT 0;
