import { z } from "zod";

const csvListSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string()));

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format");

const optionalTextSchema = z.preprocess(
  (value) => (value == null ? "" : value),
  z.string(),
);

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1),
  birthYear: z.coerce.number().int().min(1900).max(2100),
  sex: z.enum(["male", "female", "other", "unspecified"]),
  heightCm: z.coerce.number().positive(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  trainingExperience: optionalTextSchema,
  defaultWakeTime: optionalTextSchema,
  defaultSleepTime: optionalTextSchema,
  metricDate: dateStringSchema,
  weightKg: z.coerce.number().positive(),
  bodyFatPercent: z.coerce.number().min(0).max(80),
  waistCm: z.coerce.number().positive(),
  dietStyle: optionalTextSchema,
  allergies: csvListSchema,
  avoidedFoods: csvListSchema,
  preferredFoods: csvListSchema,
  dislikedFoods: csvListSchema,
  budgetLevel: optionalTextSchema,
  maxCookingMinutes: z.coerce.number().int().min(0).max(240),
  mealsPerDay: z.coerce.number().int().min(1).max(10),
  notes: optionalTextSchema,
});

export const foodEntryCreateSchema = z.object({
  date: dateStringSchema,
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().trim().min(1),
  calories: z.coerce.number().min(0),
  proteinG: z.coerce.number().min(0),
  carbsG: z.coerce.number().min(0),
  fatG: z.coerce.number().min(0),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type FoodEntryCreateInput = z.infer<typeof foodEntryCreateSchema>;

export type ApiSuccess<T> = {
  status: "ok";
  data: T;
};

export type ApiFailure = {
  status: "error";
  message: string;
  issues?: { path: string; message: string }[];
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
