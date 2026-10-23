import { describe, expect, it } from "vitest";
import { averageLatestWeights, calculateLeanBodyMassKg } from "@/lib/domain/body";

describe("body metrics", () => {
  it("calculates lean body mass from weight and body fat", () => {
    expect(calculateLeanBodyMassKg(80, 20)).toBe(64);
  });

  it("averages at most the latest seven weights", () => {
    expect(averageLatestWeights([80, 79, 78, 77, 76, 75, 74, 10])).toBe(77);
  });

  it("returns null when there are no weights", () => {
    expect(averageLatestWeights([])).toBeNull();
  });
});
