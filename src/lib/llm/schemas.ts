import { z } from "zod";

export const mealSuggestionSchema = z.object({
  mealType: z.string().min(1),
  title: z.string().min(1),
  foods: z.array(z.string().min(1)).min(1),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  prepMinutes: z.number().int().nonnegative(),
  reason: z.string().min(1),
});

export const planSuggestionSchema = z.object({
  summary: z.string().min(1),
  meals: z.array(mealSuggestionSchema).min(1),
  swaps: z.array(z.string()).default([]),
  cautions: z.array(z.string()).default([]),
  total: z.object({
    calories: z.number().nonnegative(),
    proteinG: z.number().nonnegative(),
    carbsG: z.number().nonnegative(),
    fatG: z.number().nonnegative(),
  }),
});

export type PlanSuggestion = z.infer<typeof planSuggestionSchema>;

export function validatePlanSuggestion(value: unknown) {
  return planSuggestionSchema.parse(value);
}
