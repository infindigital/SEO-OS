import { describe, expect, it } from "vitest";

import { computeTrend } from "./trend";

describe("computeTrend", () => {
  it("returns a flat trend with nulls when there is no baseline", () => {
    expect(computeTrend(100, null)).toEqual({
      delta: null,
      percentage: null,
      direction: "flat",
    });
  });

  it("computes an upward trend", () => {
    expect(computeTrend(120, 100)).toEqual({
      delta: 20,
      percentage: 20,
      direction: "up",
    });
  });

  it("computes a downward trend", () => {
    expect(computeTrend(80, 100)).toEqual({
      delta: -20,
      percentage: -20,
      direction: "down",
    });
  });

  it("avoids dividing by a zero baseline", () => {
    expect(computeTrend(5, 0)).toEqual({
      delta: 5,
      percentage: null,
      direction: "up",
    });
  });

  it("is flat when unchanged", () => {
    expect(computeTrend(50, 50)).toEqual({
      delta: 0,
      percentage: 0,
      direction: "flat",
    });
  });
});
