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
  bodyFatPercent?: number;
  leanBodyMassKg?: number;
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

const calorieFactor: Record<GoalType, number> = {
  fat_loss: 0.8,
  muscle_gain: 1.075,
  maintenance: 1,
  performance: 1,
  recomposition: 1,
};

const proteinPerKg: Record<GoalType, number> = {
  fat_loss: 2.2,
  muscle_gain: 1.9,
  maintenance: 1.8,
  performance: 1.8,
  recomposition: 1.8,
};

const fatPerKg: Record<GoalType, number> = {
  fat_loss: 0.7,
  muscle_gain: 0.9,
  maintenance: 0.9,
  performance: 0.9,
  recomposition: 0.9,
};

export function calculateBmr(input: UserBiometrics, currentYear?: number) {
  const leanBodyMassKg =
    input.leanBodyMassKg ??
    (input.bodyFatPercent == null
      ? null
      : Math.round(input.weightKg * (1 - input.bodyFatPercent / 100) * 10) / 10);

  if (leanBodyMassKg != null) {
    return Math.round(370 + 21.6 * leanBodyMassKg);
  }

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

export function nutritionFormula(input: UserBiometrics) {
  return input.leanBodyMassKg != null || input.bodyFatPercent != null
    ? "katch-mcardle"
    : "mifflin-st-jeor";
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

  return Math.round(tdee * calorieFactor[goal.type]);
}

export function calculateMacroTargets(
  biometrics: UserBiometrics,
  goal: GoalInput,
  currentYear?: number,
): MacroTargets {
  const calories = calculateTargetCalories(biometrics, goal, currentYear);
  const proteinG = Math.round(biometrics.weightKg * proteinPerKg[goal.type]);
  const fatG = Math.round(biometrics.weightKg * fatPerKg[goal.type]);
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
