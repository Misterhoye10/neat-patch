import { describe, it, expect } from "vitest";
import { calculateMetrics } from "../src/sample/buggy_module.js";

describe("calculateMetrics", () => {
  it("should calculate average for normal numbers", () => {
    expect(calculateMetrics([10, 20, 30])).toEqual({ average: 20, count: 3 });
  });

  it("should handle empty arrays without throwing", () => {
    expect(calculateMetrics([])).toEqual({ average: 0, count: 0 });
  });

  it("should handle null inputs safely", () => {
    expect(calculateMetrics(null as any)).toEqual({ average: 0, count: 0 });
  });
});
