import type { DeveloperTask } from "../../domain/audit/developer-task";
import { CATEGORY_LABEL } from "../../domain/audit/playbook";
import { PRIORITY_LABEL } from "../../domain/audit/priority";
import type { TechnicalAudit } from "../../domain/audit/technical-audit";

const MAX_URLS_LISTED = 25;

/** Render a technical audit as a Markdown document. */
export function renderAuditMarkdown(audit: TechnicalAudit): string {
  const { summary } = audit;
  const lines: string[] = [
    `# Technical SEO Audit — ${audit.host}`,
    "",
    `Generated ${audit.generatedAt} for ${audit.startUrl}.`,
    "",
    "## Summary",
    "",
    `- Issues found: ${summary.totalIssues}`,
    `- Developer tasks: ${summary.totalTasks}`,
    `- Estimated effort: ${summary.estimatedTime}`,
    `- Priority breakdown: ${summary.byPriority.critical} critical, ` +
      `${summary.byPriority.high} high, ${summary.byPriority.medium} medium, ` +
      `${summary.byPriority.low} low`,
    "",
  ];

  if (audit.tasks.length === 0) {
    lines.push("No issues found. 🎉", "");
    return lines.join("\n");
  }

  lines.push("## Developer tasks", "");
  audit.tasks.forEach((task, index) => {
    lines.push(...renderTask(task, index + 1));
  });

  return lines.join("\n");
}

function renderTask(task: DeveloperTask, position: number): string[] {
  const lines: string[] = [
    `### ${position}. ${task.title} \`${PRIORITY_LABEL[task.priority]}\``,
    "",
    `- **Category:** ${CATEGORY_LABEL[task.category]}`,
    `- **Priority:** ${PRIORITY_LABEL[task.priority]}`,
    `- **Affected pages:** ${task.occurrences}`,
    `- **Estimated time:** ${task.estimatedTime}`,
    "",
    `**Business impact:** ${task.businessImpact}`,
    "",
    `**SEO impact:** ${task.seoImpact}`,
    "",
    `**Recommended fix:** ${task.recommendedFix}`,
    "",
    "**Acceptance criteria:**",
    ...task.acceptanceCriteria.map((criterion) => `- [ ] ${criterion}`),
    "",
  ];

  if (task.affectedUrls.length > 0) {
    lines.push("**Affected URLs:**");
    for (const url of task.affectedUrls.slice(0, MAX_URLS_LISTED)) {
      lines.push(`- ${url}`);
    }
    if (task.affectedUrls.length > MAX_URLS_LISTED) {
      lines.push(`- …and ${task.affectedUrls.length - MAX_URLS_LISTED} more`);
    }
    lines.push("");
  }

  return lines;
}
