import { describe, expect, it } from "vitest";
import { decodeImageBase64, validateFoodScanResult } from "@/lib/llm/food-scan";

describe("food scan schema", () => {
  it("accepts a structured nutrition estimate", () => {
    const result = validateFoodScanResult({
      foodName: "Chicken rice bowl",
      quantity: "1",
      unit: "bowl",
      calories: "720",
      proteinG: 48,
      carbsG: 82,
      fatG: 18,
      confidence: "medium",
      items: [
        {
          name: "Chicken",
          portion: "150g",
          calories: 250,
          proteinG: 40,
          carbsG: 0,
          fatG: 8,
        },
      ],
      notes: "Visible sauce may add extra calories.",
    });

    expect(result.calories).toBe(720);
    expect(result.items).toHaveLength(1);
  });

  it("rejects a scan without a food name", () => {
    expect(() =>
      validateFoodScanResult({
        foodName: "",
        quantity: 1,
        unit: "serving",
        calories: 100,
        proteinG: 10,
        carbsG: 10,
        fatG: 2,
        confidence: "low",
      }),
    ).toThrow();
  });

  it("rejects oversized image payloads", () => {
    expect(() => decodeImageBase64("a".repeat(5_000_000))).toThrow(/3.5MB/);
  });
});
