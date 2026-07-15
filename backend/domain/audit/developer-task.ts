import type { SeoIssueType } from "../analysis/issue";
import type { TaskCategory } from "./playbook";
import type { Priority } from "./priority";

/** A prioritized, actionable remediation task for the engineering/content team. */
export interface DeveloperTask {
  id: string;
  issueType: SeoIssueType;
  title: string;
  category: TaskCategory;
  priority: Priority;
  /** Number of issue occurrences this task resolves. */
  occurrences: number;
  affectedUrls: string[];
  businessImpact: string;
  seoImpact: string;
  recommendedFix: string;
  estimatedTimeMinutes: number;
  estimatedTime: string;
  acceptanceCriteria: string[];
}

export interface AuditSummary {
  totalIssues: number;
  totalTasks: number;
  totalEstimatedMinutes: number;
  estimatedTime: string;
  byPriority: Record<Priority, number>;
}
