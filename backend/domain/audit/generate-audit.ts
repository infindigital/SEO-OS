import type { SeoIssue, SeoIssueType } from "../analysis/issue";
import type { AuditSummary, DeveloperTask } from "./developer-task";
import { REMEDIATION_PLAYBOOK } from "./playbook";
import { PRIORITY_ORDER, type Priority } from "./priority";

/** Cap occurrences used for effort estimates so they stay realistic. */
const MAX_OCCURRENCES_FOR_ESTIMATE = 50;

/** Format a minute total as a compact "Xh Ym" string. */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/** Build one prioritized developer task per issue type present in the findings. */
export function buildDeveloperTasks(issues: SeoIssue[]): DeveloperTask[] {
  const urlsByType = new Map<SeoIssueType, string[]>();
  for (const issue of issues) {
    const existing = urlsByType.get(issue.type);
    if (existing) {
      existing.push(issue.url);
    } else {
      urlsByType.set(issue.type, [issue.url]);
    }
  }

  const tasks: DeveloperTask[] = [];
  for (const [type, urls] of urlsByType) {
    const entry = REMEDIATION_PLAYBOOK[type];
    const occurrences = urls.length;
    const affectedUrls = [...new Set(urls)];
    const estimateOccurrences = Math.min(
      occurrences,
      MAX_OCCURRENCES_FOR_ESTIMATE,
    );
    const estimatedTimeMinutes =
      entry.baseMinutes +
      entry.perOccurrenceMinutes * Math.max(0, estimateOccurrences - 1);

    tasks.push({
      id: `task-${type}`,
      issueType: type,
      title: entry.title,
      category: entry.category,
      priority: entry.priority,
      occurrences,
      affectedUrls,
      businessImpact: entry.businessImpact,
      seoImpact: entry.seoImpact,
      recommendedFix: entry.recommendedFix,
      estimatedTimeMinutes,
      estimatedTime: formatMinutes(estimatedTimeMinutes),
      acceptanceCriteria: entry.acceptanceCriteria,
    });
  }

  tasks.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.occurrences - a.occurrences,
  );

  return tasks;
}

export function summarizeAudit(
  issues: SeoIssue[],
  tasks: DeveloperTask[],
): AuditSummary {
  const byPriority: Record<Priority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  let totalEstimatedMinutes = 0;

  for (const task of tasks) {
    byPriority[task.priority] += 1;
    totalEstimatedMinutes += task.estimatedTimeMinutes;
  }

  return {
    totalIssues: issues.length,
    totalTasks: tasks.length,
    totalEstimatedMinutes,
    estimatedTime: formatMinutes(totalEstimatedMinutes),
    byPriority,
  };
}

/** Turn SEO findings into a prioritized set of developer tasks + summary. */
export function buildAudit(issues: SeoIssue[]): {
  tasks: DeveloperTask[];
  summary: AuditSummary;
} {
  const tasks = buildDeveloperTasks(issues);
  return { tasks, summary: summarizeAudit(issues, tasks) };
}
