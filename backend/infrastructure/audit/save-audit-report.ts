import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { TechnicalAudit } from "../../domain/audit/technical-audit";
import { renderAuditMarkdown } from "./render-audit-markdown";

export interface SavedAudit {
  jsonPath: string;
  markdownPath: string;
}

/**
 * Write a technical audit as both JSON and Markdown under `directory` and
 * return the two file paths.
 */
export async function saveAuditReport(
  audit: TechnicalAudit,
  directory = "reports",
): Promise<SavedAudit> {
  await mkdir(directory, { recursive: true });
  const safeHost = audit.host.replace(/[^a-z0-9.-]/gi, "_");
  const stamp = audit.generatedAt.replace(/[:.]/g, "-");

  const jsonPath = join(directory, `audit-${safeHost}-${stamp}.json`);
  const markdownPath = join(directory, `audit-${safeHost}-${stamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, `${renderAuditMarkdown(audit)}\n`, "utf8");

  return { jsonPath, markdownPath };
}
