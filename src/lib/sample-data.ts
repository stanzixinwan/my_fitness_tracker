import {
  calculateMacroTargets,
  calculateRemainingNutrition,
  sumNutrition,
  type ActivityLevel,
  type FoodEntryInput,
  type GoalInput,
  type Sex,
} from "@/lib/domain/nutrition";
import type { TrainingSessionInput } from "@/lib/domain/training";

export type SampleFoodEntry = FoodEntryInput & {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  quantity: number;
  unit: string;
};

export const sampleProfile = {
  id: "demo-user",
  displayName: "Stan",
  sex: "male" as Sex,
  birthYear: 1996,
  heightCm: 178,
  activityLevel: "moderate" as ActivityLevel,
  trainingExperience: "Consistent strength training for 2 years, 4 sessions per week, prefers afternoon or evening workouts.",
  defaultWakeTime: "08:00",
  defaultSleepTime: "00:00",
};

export const latestBodyMetric = {
  date: "2026-04-30",
  weightKg: 78.4,
  bodyFatPercent: 18.5,
  waistCm: 84,
};

export const activeGoal: GoalInput & {
  title: string;
  targetWeightKg: number;
  endDate: string;
} = {
  type: "recomposition",
  title: "Slow fat loss while maintaining strength performance",
  targetWeightKg: 75,
  weeklyWeightDeltaKg: -0.25,
  endDate: "2026-08-01",
};

export const dietPreference = {
  dietStyle: "High protein, easy to prepare, carbs not overly restricted",
  allergies: ["No known allergies"],
  avoidedFoods: ["Fried food", "Sugary drinks"],
  preferredFoods: ["Chicken breast", "Eggs", "Greek yogurt", "Rice", "Beef", "Broccoli"],
  dislikedFoods: ["Celery"],
  budgetLevel: "Medium",
  maxCookingMinutes: 30,
  mealsPerDay: 3,
  notes: "Prefer stable, repeatable advice that does not swing wildly with conversational tone day to day.",
};

export const todayLog = {
  date: "2026-04-30",
  sleepHours: 7,
  stressLevel: 3,
  scheduleNote: "Strength training at 6 PM, 30 minutes to cook in the evening.",
  trainingStatus: "planned",
};

export const foodEntries: SampleFoodEntry[] = [
  {
    id: "breakfast-1",
    mealType: "breakfast",
    foodName: "Oats 60g + milk 250ml + 2 eggs",
    quantity: 1,
    unit: "serving",
    calories: 560,
    proteinG: 31,
    carbsG: 62,
    fatG: 20,
  },
  {
    id: "lunch-1",
    mealType: "lunch",
    foodName: "Chicken breast rice bowl",
    quantity: 1,
    unit: "serving",
    calories: 720,
    proteinG: 52,
    carbsG: 86,
    fatG: 16,
  },
];

export const plannedTraining: TrainingSessionInput = {
  title: "Upper Strength",
  type: "strength",
  durationMin: 70,
  sets: [
    { exerciseName: "Bench Press", reps: 5, weightKg: 82.5, rpe: 8 },
    { exerciseName: "Bench Press", reps: 5, weightKg: 82.5, rpe: 8 },
    { exerciseName: "Barbell Row", reps: 8, weightKg: 75, rpe: 8 },
    { exerciseName: "Overhead Press", reps: 6, weightKg: 50, rpe: 7.5 },
  ],
};

export function getTodayNutritionSnapshot() {
  const biometrics = {
    ...sampleProfile,
    weightKg: latestBodyMetric.weightKg,
  };
  const targets = calculateMacroTargets(biometrics, activeGoal);
  const consumed = sumNutrition(foodEntries);
  const remaining = calculateRemainingNutrition(targets, consumed);

  return {
    biometrics,
    targets,
    consumed,
    remaining,
  };
}
