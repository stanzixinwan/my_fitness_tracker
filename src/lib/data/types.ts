import type { PlanSuggestion } from "@/lib/llm/schemas";

export type SexRecord = "male" | "female" | "other" | "unspecified";

export type ActivityLevelRecord =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalTypeRecord =
  | "fat_loss"
  | "muscle_gain"
  | "maintenance"
  | "performance"
  | "recomposition";

export type MealTypeRecord = "breakfast" | "lunch" | "dinner" | "snack";

export type SuggestionStatusRecord = "draft" | "accepted" | "rejected" | "completed";

export type ProfileRecord = {
  id: string;
  displayName: string;
  sex: SexRecord;
  birthYear: number;
  heightCm: number;
  activityLevel: ActivityLevelRecord;
  trainingExperience: string;
  defaultWakeTime: string;
  defaultSleepTime: string;
};

export type BodyMetricRecord = {
  date: string;
  weightKg: number;
  bodyFatPercent: number;
  waistCm: number;
};

export type GoalRecord = {
  type: GoalTypeRecord;
  title: string;
  targetWeightKg: number;
  weeklyWeightDeltaKg?: number;
  endDate: string;
};

export type DietPreferenceRecord = {
  dietStyle: string;
  allergies: string[];
  avoidedFoods: string[];
  preferredFoods: string[];
  dislikedFoods: string[];
  budgetLevel: string;
  maxCookingMinutes: number;
  mealsPerDay: number;
  notes: string;
};

export type FoodEntryRecord = {
  id: string;
  mealType: MealTypeRecord;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type ProfileBundle = {
  profile: ProfileRecord;
  latestBodyMetric: BodyMetricRecord;
  activeGoal: GoalRecord;
  dietPreference: DietPreferenceRecord;
  isPersisted: boolean;
};

export type PlanSuggestionRecord = {
  id: string;
  date: string;
  model: string;
  inputSummary: Record<string, unknown>;
  suggestion: PlanSuggestion;
  status: SuggestionStatusRecord;
  createdAt: string;
};

export type CreatePlanSuggestionInput = {
  date: string;
  model: string;
  inputSummary: Record<string, unknown>;
  suggestion: PlanSuggestion;
};
