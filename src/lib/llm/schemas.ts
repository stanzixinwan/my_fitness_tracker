import { z } from "zod";

const nonNegativeNumber = z.coerce.number().nonnegative();

export const mealSuggestionSchema = z.object({
  mealType: z.string().min(1),
  title: z.string().min(1),
  foods: z.array(z.string().min(1)).min(1),
  calories: nonNegativeNumber,
  proteinG: nonNegativeNumber,
  carbsG: nonNegativeNumber,
  fatG: nonNegativeNumber,
  prepMinutes: z.coerce.number().nonnegative().transform((value) => Math.round(value)),
  reason: z.string().min(1),
});

export const planSuggestionSchema = z.object({
  summary: z.string().min(1),
  meals: z.array(mealSuggestionSchema).min(1),
  swaps: z.array(z.string()).default([]),
  cautions: z.array(z.string()).default([]),
  total: z.object({
    calories: nonNegativeNumber,
    proteinG: nonNegativeNumber,
    carbsG: nonNegativeNumber,
    fatG: nonNegativeNumber,
  }),
});

export type PlanSuggestion = z.infer<typeof planSuggestionSchema>;

export function validatePlanSuggestion(value: unknown) {
  return planSuggestionSchema.parse(value);
}
