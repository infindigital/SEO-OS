import type { AuditSummary, DeveloperTask } from "./developer-task";

export interface TechnicalAudit {
  startUrl: string;
  host: string;
  generatedAt: string;
  summary: AuditSummary;
  tasks: DeveloperTask[];
}
