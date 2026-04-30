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
  trainingExperience: "稳定力量训练 2 年，每周 4 次，偏好午后或晚上训练。",
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
  title: "慢速减脂并维持力量表现",
  targetWeightKg: 75,
  weeklyWeightDeltaKg: -0.25,
  endDate: "2026-08-01",
};

export const dietPreference = {
  dietStyle: "高蛋白、易准备、不过度限制碳水",
  allergies: ["无已知过敏"],
  avoidedFoods: ["油炸食品", "含糖饮料"],
  preferredFoods: ["鸡胸肉", "鸡蛋", "希腊酸奶", "米饭", "牛肉", "西兰花"],
  dislikedFoods: ["芹菜"],
  budgetLevel: "中等",
  maxCookingMinutes: 30,
  mealsPerDay: 3,
  notes: "希望建议稳定、可重复执行，不要每天因为语气变化而大幅波动。",
};

export const todayLog = {
  date: "2026-04-30",
  sleepHours: 7,
  stressLevel: 3,
  scheduleNote: "下午 6 点力量训练，晚上有 30 分钟做饭时间。",
  trainingStatus: "planned",
};

export const foodEntries: SampleFoodEntry[] = [
  {
    id: "breakfast-1",
    mealType: "breakfast",
    foodName: "燕麦 60g + 牛奶 250ml + 鸡蛋 2 个",
    quantity: 1,
    unit: "份",
    calories: 560,
    proteinG: 31,
    carbsG: 62,
    fatG: 20,
  },
  {
    id: "lunch-1",
    mealType: "lunch",
    foodName: "鸡胸肉饭碗",
    quantity: 1,
    unit: "份",
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
