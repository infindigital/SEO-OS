import { describe, expect, it } from "vitest";

import { computeCtr } from "./metrics";

describe("computeCtr", () => {
  it("computes clicks divided by impressions", () => {
    expect(computeCtr(5, 100)).toBe(0.05);
  });

  it("is zero when there are no impressions", () => {
    expect(computeCtr(0, 0)).toBe(0);
    expect(computeCtr(3, 0)).toBe(0);
  });
});
