/** Click-through rate as a fraction in [0, 1]; 0 when there are no impressions. */
export function computeCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? clicks / impressions : 0;
}
