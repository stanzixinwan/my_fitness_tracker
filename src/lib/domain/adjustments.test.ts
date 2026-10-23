import { describe, expect, it } from "vitest";
import {
  proposeCalorieAdjustment,
  proposeLoadAdjustments,
  proposeSetAdjustment,
  type ExerciseSessionResult,
} from "@/lib/domain/adjustments";

function session(
  date: string,
  movementPattern: string,
  sets: ExerciseSessionResult["sets"],
): ExerciseSessionResult {
  return {
    exerciseName: "Bench",
    movementPattern,
    date,
    targetSets: 2,
    targetRepsMin: 6,
    targetRpe: 8,
    sets,
  };
}

describe("adjustment rules", () => {
  it("adds 2.5kg for an upper lift completed twice under the RPE cap", () => {
    const [adjustment] = proposeLoadAdjustments([
      session("2026-11-02", "horizontal push", [
        { reps: 6, weightKg: 80, rpe: 8 },
        { reps: 6, weightKg: 80, rpe: 8 },
      ]),
      session("2026-11-09", "horizontal push", [
        { reps: 8, weightKg: 80, rpe: 7 },
        { reps: 6, weightKg: 80, rpe: 8 },
      ]),
    ]);

    expect(adjustment?.afterValue).toBe(82.5);
  });

  it("caps a lower-body jump at 5 percent", () => {
    const [adjustment] = proposeLoadAdjustments([
      session("2026-11-02", "squat", [
        { reps: 6, weightKg: 60, rpe: 8 },
        { reps: 6, weightKg: 60, rpe: 8 },
      ]),
      session("2026-11-09", "squat", [
        { reps: 6, weightKg: 60, rpe: 8 },
        { reps: 6, weightKg: 60, rpe: 8 },
      ]),
    ]);

    expect(adjustment?.afterValue).toBe(63);
  });

  it("cuts 5 percent after two missed sessions", () => {
    const [adjustment] = proposeLoadAdjustments([
      session("2026-11-02", "horizontal push", [
        { reps: 4, weightKg: 100, rpe: 9 },
        { reps: 4, weightKg: 100, rpe: 9 },
      ]),
      session("2026-11-09", "horizontal push", [
        { reps: 3, weightKg: 100, rpe: 9 },
        { reps: 4, weightKg: 100, rpe: 9 },
      ]),
    ]);

    expect(adjustment?.afterValue).toBe(95);
  });

  it("reduces calories when fat loss is slower than 0.25 percent per week", () => {
    const adjustment = proposeCalorieAdjustment({
      goalType: "fat_loss",
      startWeightKg: 80,
      endWeightKg: 79.9,
      days: 14,
      calories: 2200,
    });

    expect(adjustment?.afterValue).toBe(2075);
  });

  it("drops weekly sets by 20 percent when RPE stays high", () => {
    expect(
      proposeSetAdjustment({ averageRpe: 9, targetRpe: 8, plannedSets: 16 })?.afterValue,
    ).toBe(13);
  });
});
