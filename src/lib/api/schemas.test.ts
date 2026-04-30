import { describe, expect, it } from "vitest";
import { foodEntryCreateSchema, profileUpdateSchema } from "@/lib/api/schemas";

const validProfilePayload = {
  displayName: "Stan",
  birthYear: "1996",
  sex: "male",
  heightCm: "178",
  activityLevel: "moderate",
  trainingExperience: "4 lifting sessions per week",
  defaultWakeTime: "08:00",
  defaultSleepTime: "00:00",
  metricDate: "2026-04-30",
  weightKg: "78.4",
  bodyFatPercent: "18.5",
  waistCm: "84",
  dietStyle: "high protein",
  allergies: "none",
  avoidedFoods: "fried food, soda",
  preferredFoods: "eggs, rice, chicken",
  dislikedFoods: "celery",
  budgetLevel: "medium",
  maxCookingMinutes: "30",
  mealsPerDay: "3",
  notes: "keep suggestions stable",
};

describe("API schemas", () => {
  it("coerces profile form-style payloads into typed API input", () => {
    const parsed = profileUpdateSchema.parse(validProfilePayload);

    expect(parsed.birthYear).toBe(1996);
    expect(parsed.heightCm).toBe(178);
    expect(parsed.preferredFoods).toEqual(["eggs", "rice", "chicken"]);
  });

  it("rejects invalid profile payloads", () => {
    expect(() =>
      profileUpdateSchema.parse({
        ...validProfilePayload,
        metricDate: "04/30/2026",
      }),
    ).toThrow();
  });

  it("coerces food entry payloads into typed API input", () => {
    const parsed = foodEntryCreateSchema.parse({
      date: "2026-04-30",
      mealType: "snack",
      foodName: "Greek yogurt",
      quantity: "1",
      unit: "serving",
      calories: "180",
      proteinG: "20",
      carbsG: "12",
      fatG: "4",
    });

    expect(parsed.calories).toBe(180);
    expect(parsed.mealType).toBe("snack");
  });

  it("rejects food entries without a food name", () => {
    expect(() =>
      foodEntryCreateSchema.parse({
        date: "2026-04-30",
        mealType: "snack",
        foodName: "",
        quantity: 1,
        unit: "serving",
        calories: 180,
        proteinG: 20,
        carbsG: 12,
        fatG: 4,
      }),
    ).toThrow();
  });
});
