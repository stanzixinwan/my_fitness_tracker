import { describe, expect, it } from "vitest";
import { validatePlanSuggestion } from "@/lib/llm/schemas";

describe("plan suggestion schema", () => {
  it("accepts structured meal plans", () => {
    const result = validatePlanSuggestion({
      summary: "Prioritize protein after training.",
      meals: [
        {
          mealType: "dinner",
          title: "Chicken rice bowl",
          foods: ["chicken", "rice", "vegetables"],
          calories: 700,
          proteinG: 55,
          carbsG: 80,
          fatG: 15,
          prepMinutes: 25,
          reason: "Supports recovery.",
        },
      ],
      swaps: [],
      cautions: [],
      total: {
        calories: 700,
        proteinG: 55,
        carbsG: 80,
        fatG: 15,
      },
    });

    expect(result.meals[0].title).toBe("Chicken rice bowl");
  });

  it("rejects unstructured or incomplete plans", () => {
    expect(() => validatePlanSuggestion({ summary: "missing meals" })).toThrow();
  });
});
