import { describe, expect, it } from "vitest";

import { defaultDateRange } from "./date-range";

describe("defaultDateRange", () => {
  it("returns a window ending before now by the configured lag", () => {
    const now = new Date("2026-07-15T00:00:00.000Z");
    const { startDate, endDate } = defaultDateRange(now, 28, 3);
    expect(endDate).toBe("2026-07-12");
    expect(startDate).toBe("2026-06-14");
  });
});
