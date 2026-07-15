import { buildAudit } from "../../../domain/audit/generate-audit";
import type { TechnicalAudit } from "../../../domain/audit/technical-audit";
import type { AnalysisReport } from "../../analysis/dto";
import { systemClock, type Clock } from "../../crawl/ports/clock";

/**
 * Generate a technical audit from an analysis report: prioritized developer
 * tasks with impact, fixes, effort estimates and acceptance criteria.
 */
export class GenerateTechnicalAudit {
  constructor(private readonly clock: Clock = systemClock) {}

  execute(analysis: AnalysisReport): TechnicalAudit {
    const { tasks, summary } = buildAudit(analysis.issues);

    return {
      startUrl: analysis.startUrl,
      host: analysis.host,
      generatedAt: this.clock.now().toISOString(),
      summary,
      tasks,
    };
  }
}
