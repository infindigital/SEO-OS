export interface AnalysisThresholds {
  /** Pages with fewer words than this are flagged as thin content. */
  thinContentWordCount: number;
  /** Images larger than this many bytes are flagged as large. */
  largeImageBytes: number;
  /** Redirect chains with at least this many hops are flagged. */
  redirectChainMinHops: number;
}

export const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  thinContentWordCount: 250,
  largeImageBytes: 100 * 1024,
  redirectChainMinHops: 2,
};
