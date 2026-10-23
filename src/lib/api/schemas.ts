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

const optionalDateSchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return null;
  }

  return value;
}, dateStringSchema.nullable());

function optionalNumber(min: number, max?: number) {
  const numberSchema = max == null ? z.number().min(min) : z.number().min(min).max(max);

  return z.preprocess((value) => {
    if (value === "" || value == null) {
      return null;
    }

    const parsed = typeof value === "number" ? value : Number(value);

    return Number.isFinite(parsed) ? parsed : value;
  }, numberSchema.nullable());
}

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1),
  birthDate: dateStringSchema,
  injuryHistory: optionalTextSchema,
  sex: z.enum(["male", "female", "other", "unspecified"]),
  heightCm: z.coerce.number().positive(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  trainingExperience: optionalTextSchema,
  defaultWakeTime: optionalTextSchema,
  defaultSleepTime: optionalTextSchema,
  metricDate: dateStringSchema,
  weightKg: z.coerce.number().positive(),
  bodyFatPercent: optionalNumber(0, 80),
  waistCm: optionalNumber(1),
  chestCm: optionalNumber(1),
  hipCm: optionalNumber(1),
  armCm: optionalNumber(1),
  thighCm: optionalNumber(1),
  restingHeartRate: optionalNumber(1, 220),
  goalType: z.enum(["fat_loss", "muscle_gain", "maintenance"]),
  goalTitle: z.string().trim().min(1),
  targetWeightKg: optionalNumber(1),
  goalEndDate: optionalDateSchema,
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

export const programGenerateSchema = z.object({
  startDate: dateStringSchema,
  daysPerWeek: z.coerce.number().int().min(3).max(6),
});

export const trainingSetCreateSchema = z.object({
  date: dateStringSchema,
  exerciseName: z.string().trim().min(1),
  reps: z.coerce.number().int().positive(),
  weightKg: optionalNumber(0),
  rpe: optionalNumber(0, 10),
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
  source: z.string().trim().min(1).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type FoodEntryCreateInput = z.infer<typeof foodEntryCreateSchema>;
export type TrainingSetCreateInput = z.infer<typeof trainingSetCreateSchema>;
export type ProgramGenerateInput = z.infer<typeof programGenerateSchema>;

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
