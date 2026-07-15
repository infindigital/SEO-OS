import type { AnalysisSummary } from "../../domain/analysis/analyze-crawl";
import type { SeoIssue } from "../../domain/analysis/issue";
import type { AnalysisThresholds } from "../../domain/analysis/thresholds";

export interface AnalysisReport {
  startUrl: string;
  host: string;
  analyzedAt: string;
  thresholds: AnalysisThresholds;
  summary: AnalysisSummary;
  issues: SeoIssue[];
}
