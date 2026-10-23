import { describe, expect, it } from "vitest";
import { calculateE1rm, calculateTrainingVolume, sessionCompletionPercent } from "@/lib/domain/training";

describe("training calculations", () => {
  it("estimates e1RM with the Epley formula", () => {
    expect(calculateE1rm(100, 5)).toBe(116.7);
    expect(calculateE1rm(100, 1)).toBe(100);
  });

  it("sums reps times weight", () => {
    expect(
      calculateTrainingVolume({
        title: "Lower",
        type: "strength",
        sets: [
          { exerciseName: "Squat", reps: 5, weightKg: 100 },
          { exerciseName: "Squat", reps: 5, weightKg: 100 },
        ],
      }),
    ).toBe(1000);
  });

  it("compares logged sets with the planned set count", () => {
    expect(sessionCompletionPercent(2, 4)).toBe(50);
    expect(sessionCompletionPercent(5, 4)).toBe(100);
    expect(sessionCompletionPercent(0, 0)).toBeNull();
  });
});
