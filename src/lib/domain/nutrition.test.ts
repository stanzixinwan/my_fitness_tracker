import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateMacroTargets,
  calculateRemainingNutrition,
  calculateTdee,
  sumNutrition,
} from "@/lib/domain/nutrition";

const biometrics = {
  sex: "male" as const,
  birthYear: 1996,
  heightCm: 178,
  weightKg: 78,
  activityLevel: "moderate" as const,
};

describe("nutrition calculations", () => {
  it("calculates TDEE from structured biometrics", () => {
    expect(calculateTdee(biometrics, 2026)).toBe(2709);
  });

  it("derives macro targets and remaining nutrition", () => {
    const targets = calculateMacroTargets(
      biometrics,
      { type: "fat_loss", weeklyWeightDeltaKg: -0.35 },
      2026,
    );
    const consumed = sumNutrition([
      { calories: 500, proteinG: 30, carbsG: 55, fatG: 15 },
      { calories: 700, proteinG: 50, carbsG: 80, fatG: 20 },
    ]);
    const remaining = calculateRemainingNutrition(targets, consumed);

    expect(targets.calories).toBe(2167);
    expect(targets.proteinG).toBe(172);
    expect(consumed.calories).toBe(1200);
    expect(remaining.proteinG).toBe(92);
  });

  it("uses Katch-McArdle when body fat is available", () => {
    const bmr = calculateBmr({ ...biometrics, bodyFatPercent: 20 });

    expect(bmr).toBe(Math.round(370 + 21.6 * 62.4));
  });
});
