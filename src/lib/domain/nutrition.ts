export type Sex = "male" | "female" | "other" | "unspecified";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType =
  | "fat_loss"
  | "muscle_gain"
  | "maintenance"
  | "performance"
  | "recomposition";

export type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type NutritionTotals = MacroTargets;

export type UserBiometrics = {
  sex: Sex;
  birthYear?: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
};

export type GoalInput = {
  type: GoalType;
  weeklyWeightDeltaKg?: number;
};

export type FoodEntryInput = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateAge(birthYear: number, currentYear = new Date().getFullYear()) {
  return Math.max(13, currentYear - birthYear);
}

export function calculateBmr(input: UserBiometrics, currentYear?: number) {
  const age = input.birthYear ? calculateAge(input.birthYear, currentYear) : 30;
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age;

  if (input.sex === "male") {
    return Math.round(base + 5);
  }

  if (input.sex === "female") {
    return Math.round(base - 161);
  }

  return Math.round(base - 78);
}

export function calculateTdee(input: UserBiometrics, currentYear?: number) {
  return Math.round(
    calculateBmr(input, currentYear) * activityMultipliers[input.activityLevel],
  );
}

export function calculateTargetCalories(
  biometrics: UserBiometrics,
  goal: GoalInput,
  currentYear?: number,
) {
  const tdee = calculateTdee(biometrics, currentYear);

  if (goal.type === "maintenance" || goal.type === "performance") {
    return tdee;
  }

  if (goal.weeklyWeightDeltaKg) {
    return Math.round(tdee + (goal.weeklyWeightDeltaKg * 7700) / 7);
  }

  if (goal.type === "fat_loss") {
    return Math.round(tdee - 450);
  }

  if (goal.type === "muscle_gain") {
    return Math.round(tdee + 250);
  }

  return Math.round(tdee - 200);
}

export function calculateMacroTargets(
  biometrics: UserBiometrics,
  goal: GoalInput,
  currentYear?: number,
): MacroTargets {
  const calories = calculateTargetCalories(biometrics, goal, currentYear);
  const proteinPerKg = goal.type === "fat_loss" ? 2.0 : 1.8;
  const fatPerKg = goal.type === "fat_loss" ? 0.8 : 0.9;
  const proteinG = Math.round(biometrics.weightKg * proteinPerKg);
  const fatG = Math.round(biometrics.weightKg * fatPerKg);
  const remainingCalories = Math.max(0, calories - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(remainingCalories / 4);

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function sumNutrition(entries: FoodEntryInput[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      proteinG: totals.proteinG + entry.proteinG,
      carbsG: totals.carbsG + entry.carbsG,
      fatG: totals.fatG + entry.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function calculateRemainingNutrition(
  targets: MacroTargets,
  consumed: NutritionTotals,
): NutritionTotals {
  return {
    calories: Math.max(0, Math.round(targets.calories - consumed.calories)),
    proteinG: Math.max(0, Math.round(targets.proteinG - consumed.proteinG)),
    carbsG: Math.max(0, Math.round(targets.carbsG - consumed.carbsG)),
    fatG: Math.max(0, Math.round(targets.fatG - consumed.fatG)),
  };
}

export function completionPercent(consumed: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(999, Math.round((consumed / target) * 100));
}
