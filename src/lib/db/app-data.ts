import { revalidatePath } from "next/cache";
import {
  foodEntryCreateSchema,
  profileUpdateSchema,
  type FoodEntryCreateInput,
  type ProfileUpdateInput,
} from "@/lib/api/schemas";
import { localDateString, localDayRange } from "@/lib/dates";
import { averageLatestWeights, calculateLeanBodyMassKg } from "@/lib/domain/body";
import {
  calculateMacroTargets,
  calculateRemainingNutrition,
  nutritionFormula,
  sumNutrition,
  type ActivityLevel,
  type GoalInput,
  type MacroTargets,
  type NutritionTotals,
  type Sex,
} from "@/lib/domain/nutrition";
import {
  summarizeTraining,
  type TrainingSessionInput,
} from "@/lib/domain/training";
import { localUserId } from "@/lib/db/local-user";
import { requirePrisma } from "@/lib/db/prisma";

const sexFromDb = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  UNSPECIFIED: "unspecified",
} as const;

const sexToDb = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
  unspecified: "UNSPECIFIED",
} as const;

const activityFromDb = {
  SEDENTARY: "sedentary",
  LIGHT: "light",
  MODERATE: "moderate",
  ACTIVE: "active",
  VERY_ACTIVE: "very_active",
} as const;

const activityToDb = {
  sedentary: "SEDENTARY",
  light: "LIGHT",
  moderate: "MODERATE",
  active: "ACTIVE",
  very_active: "VERY_ACTIVE",
} as const;

const mealFromDb = {
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  SNACK: "snack",
  PRE_WORKOUT: "snack",
  POST_WORKOUT: "snack",
} as const;

const mealToDb = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
  snack: "SNACK",
} as const;

const goalFromDb = {
  FAT_LOSS: "fat_loss",
  MUSCLE_GAIN: "muscle_gain",
  MAINTENANCE: "maintenance",
  PERFORMANCE: "performance",
  RECOMPOSITION: "recomposition",
} as const;

const goalToDb = {
  fat_loss: "FAT_LOSS",
  muscle_gain: "MUSCLE_GAIN",
  maintenance: "MAINTENANCE",
} as const;

export type ProfileFields = {
  displayName: string;
  sex: Sex;
  birthDate: string;
  birthYear: number | null;
  injuryHistory: string;
  heightCm: number | null;
  activityLevel: ActivityLevel;
  trainingExperience: string;
  defaultWakeTime: string;
  defaultSleepTime: string;
};

export type BodyMetricFields = {
  date: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  leanBodyMassKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  restingHeartRate: number | null;
  source: string;
};

export type GoalFields = {
  type: GoalInput["type"];
  title: string;
  targetWeightKg: number | null;
  weeklyWeightDeltaKg: number | null;
  endDate: string | null;
};

export type DietPreferenceFields = {
  dietStyle: string;
  allergies: string[];
  avoidedFoods: string[];
  preferredFoods: string[];
  dislikedFoods: string[];
  budgetLevel: string;
  maxCookingMinutes: number | null;
  mealsPerDay: number | null;
  notes: string;
};

export type ProfileData = {
  hasProfile: boolean;
  profile: ProfileFields;
  latestBodyMetric: BodyMetricFields;
  recentWeightAverageKg: number | null;
  activeGoal: GoalFields | null;
  dietPreference: DietPreferenceFields;
};

export type FoodEntryRecord = {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type FoodLogData = {
  date: string;
  foodEntries: FoodEntryRecord[];
  targets: MacroTargets | null;
  consumed: NutritionTotals;
  remaining: NutritionTotals | null;
};

export type TrainingSessionRecord = TrainingSessionInput & {
  id: string;
  volumeKg: number;
  workingSets: number;
};

export type TrainingLogData = {
  date: string;
  sessions: TrainingSessionRecord[];
};

const emptyDietPreference: DietPreferenceFields = {
  dietStyle: "",
  allergies: [],
  avoidedFoods: [],
  preferredFoods: [],
  dislikedFoods: [],
  budgetLevel: "",
  maxCookingMinutes: null,
  mealsPerDay: null,
  notes: "",
};

function emptyProfileData(date: string): ProfileData {
  return {
    hasProfile: false,
    profile: {
      displayName: "",
      sex: "unspecified",
      birthDate: "",
      birthYear: null,
      injuryHistory: "",
      heightCm: null,
      activityLevel: "moderate",
      trainingExperience: "",
      defaultWakeTime: "",
      defaultSleepTime: "",
    },
    latestBodyMetric: {
      date,
      weightKg: null,
      bodyFatPercent: null,
      leanBodyMassKg: null,
      waistCm: null,
      chestCm: null,
      hipCm: null,
      armCm: null,
      thighCm: null,
      restingHeartRate: null,
      source: "manual",
    },
    recentWeightAverageKg: null,
    activeGoal: null,
    dietPreference: emptyDietPreference,
  };
}

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function mapMetric(
  metric: {
    date: Date;
    weightKg: number;
    bodyFatPercent: number | null;
    leanBodyMassKg: number | null;
    waistCm: number | null;
    chestCm: number | null;
    hipCm: number | null;
    armCm: number | null;
    thighCm: number | null;
    restingHeartRate: number | null;
    source: string | null;
  } | undefined,
  today: string,
): BodyMetricFields {
  if (!metric) {
    return emptyProfileData(today).latestBodyMetric;
  }

  return {
    date: localDateString(metric.date),
    weightKg: metric.weightKg,
    bodyFatPercent: metric.bodyFatPercent,
    leanBodyMassKg: metric.leanBodyMassKg,
    waistCm: metric.waistCm,
    chestCm: metric.chestCm,
    hipCm: metric.hipCm,
    armCm: metric.armCm,
    thighCm: metric.thighCm,
    restingHeartRate: metric.restingHeartRate,
    source: metric.source ?? "manual",
  };
}

export async function getProfileData(): Promise<ProfileData> {
  const prisma = requirePrisma();
  const today = localDateString();
  const user = await prisma.userProfile.findUnique({
    where: { id: localUserId },
    include: {
      bodyMetrics: { orderBy: { date: "desc" }, take: 7 },
      goals: { where: { isActive: true }, orderBy: { priority: "asc" }, take: 1 },
      dietPreference: true,
    },
  });

  if (!user) {
    return emptyProfileData(today);
  }

  const metric = user.bodyMetrics[0];
  const goal = user.goals[0];
  const diet = user.dietPreference;

  return {
    hasProfile: true,
    profile: {
      displayName: user.displayName,
      sex: sexFromDb[user.sex],
      birthDate: user.birthDate ? localDateString(user.birthDate) : "",
      birthYear: user.birthYear,
      injuryHistory: user.injuryHistory ?? "",
      heightCm: user.heightCm,
      activityLevel: activityFromDb[user.activityLevel],
      trainingExperience: user.trainingExperience ?? "",
      defaultWakeTime: user.defaultWakeTime ?? "",
      defaultSleepTime: user.defaultSleepTime ?? "",
    },
    latestBodyMetric: mapMetric(metric, today),
    recentWeightAverageKg: averageLatestWeights(user.bodyMetrics.map((row) => row.weightKg)),
    activeGoal: goal
      ? {
          type: goalFromDb[goal.type],
          title: goal.title,
          targetWeightKg: goal.targetWeightKg,
          weeklyWeightDeltaKg: goal.weeklyWeightDeltaKg,
          endDate: goal.endDate ? localDateString(goal.endDate) : null,
        }
      : null,
    dietPreference: {
      dietStyle: diet?.dietStyle ?? "",
      allergies: diet?.allergies ?? [],
      avoidedFoods: diet?.avoidedFoods ?? [],
      preferredFoods: diet?.preferredFoods ?? [],
      dislikedFoods: diet?.dislikedFoods ?? [],
      budgetLevel: diet?.budgetLevel ?? "",
      maxCookingMinutes: diet?.maxCookingMinutes ?? null,
      mealsPerDay: diet?.mealsPerDay ?? null,
      notes: diet?.notes ?? "",
    },
  };
}

export async function getFoodLogData(date = localDateString()): Promise<FoodLogData> {
  const prisma = requirePrisma();
  const profileData = await getProfileData();
  const range = localDayRange(date);
  const rows = await prisma.foodEntry.findMany({
    where: {
      userId: localUserId,
      eatenAt: range,
    },
    orderBy: { eatenAt: "asc" },
  });
  const foodEntries: FoodEntryRecord[] = rows.map((entry) => ({
    id: entry.id,
    mealType: mealFromDb[entry.mealType],
    foodName: entry.foodName,
    quantity: entry.quantity,
    unit: entry.unit,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
  }));
  const consumed = sumNutrition(foodEntries);
  const day = localDayRange(date);
  const storedTarget = await prisma.nutritionTarget.findFirst({
    where: {
      userId: localUserId,
      effectiveDate: { lt: day.lt },
    },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
  const targets = storedTarget
    ? {
        calories: storedTarget.calories,
        proteinG: storedTarget.proteinG,
        carbsG: storedTarget.carbsG,
        fatG: storedTarget.fatG,
      }
    : null;

  return {
    date,
    foodEntries,
    targets,
    consumed,
    remaining: targets ? calculateRemainingNutrition(targets, consumed) : null,
  };
}

export async function getTrainingLogData(date = localDateString()): Promise<TrainingLogData> {
  const prisma = requirePrisma();
  const range = localDayRange(date);
  const rows = await prisma.trainingSession.findMany({
    where: {
      userId: localUserId,
      date: range,
    },
    include: {
      sets: { orderBy: { setNumber: "asc" } },
    },
    orderBy: { date: "asc" },
  });

  return {
    date,
    sessions: rows.map((session) => {
      const input: TrainingSessionInput = {
        title: session.title,
        type: session.type,
        durationMin: session.durationMin ?? undefined,
        sets: session.sets.map((set) => ({
          exerciseName: set.exerciseName,
          reps: set.reps,
          weightKg: set.weightKg ?? undefined,
          rpe: set.rpe ?? undefined,
        })),
      };
      const summary = summarizeTraining(input);

      return {
        id: session.id,
        ...input,
        volumeKg: summary.volumeKg,
        workingSets: summary.workingSets,
      };
    }),
  };
}

export async function updateProfile(input: ProfileUpdateInput) {
  const prisma = requirePrisma();

  const birthDate = new Date(`${input.birthDate}T00:00:00`);
  const birthYear = birthDate.getFullYear();
  const leanBodyMassKg =
    input.bodyFatPercent == null
      ? null
      : calculateLeanBodyMassKg(input.weightKg, input.bodyFatPercent);

  await prisma.userProfile.upsert({
    where: { id: localUserId },
    update: {
      displayName: input.displayName,
      birthDate,
      birthYear,
      injuryHistory: input.injuryHistory,
      sex: sexToDb[input.sex],
      heightCm: input.heightCm,
      activityLevel: activityToDb[input.activityLevel],
      trainingExperience: input.trainingExperience,
      defaultWakeTime: input.defaultWakeTime,
      defaultSleepTime: input.defaultSleepTime,
    },
    create: {
      id: localUserId,
      displayName: input.displayName,
      birthDate,
      birthYear,
      injuryHistory: input.injuryHistory,
      sex: sexToDb[input.sex],
      heightCm: input.heightCm,
      activityLevel: activityToDb[input.activityLevel],
      trainingExperience: input.trainingExperience,
      defaultWakeTime: input.defaultWakeTime,
      defaultSleepTime: input.defaultSleepTime,
    },
  });

  const metricDate = new Date(`${input.metricDate}T00:00:00`);
  const metricData = {
    weightKg: input.weightKg,
    bodyFatPercent: input.bodyFatPercent,
    leanBodyMassKg,
    waistCm: input.waistCm,
    chestCm: input.chestCm,
    hipCm: input.hipCm,
    armCm: input.armCm,
    thighCm: input.thighCm,
    restingHeartRate:
      input.restingHeartRate == null ? null : Math.round(input.restingHeartRate),
    source: "manual",
  };

  await prisma.bodyMetric.upsert({
    where: {
      userId_date: {
        userId: localUserId,
        date: metricDate,
      },
    },
    update: metricData,
    create: {
      userId: localUserId,
      date: metricDate,
      ...metricData,
    },
  });

  await prisma.goal.updateMany({
    where: { userId: localUserId, isActive: true },
    data: { isActive: false },
  });
  await prisma.goal.create({
    data: {
      userId: localUserId,
      type: goalToDb[input.goalType],
      title: input.goalTitle,
      targetWeightKg: input.targetWeightKg,
      startDate: metricDate,
      endDate: input.goalEndDate ? new Date(`${input.goalEndDate}T00:00:00`) : null,
      isActive: true,
    },
  });

  const biometrics = {
    sex: input.sex,
    birthYear,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    bodyFatPercent: input.bodyFatPercent ?? undefined,
    leanBodyMassKg: leanBodyMassKg ?? undefined,
  };
  const targets = calculateMacroTargets(biometrics, { type: input.goalType });

  await prisma.nutritionTarget.create({
    data: {
      userId: localUserId,
      effectiveDate: metricDate,
      calories: targets.calories,
      proteinG: targets.proteinG,
      carbsG: targets.carbsG,
      fatG: targets.fatG,
      formula: nutritionFormula(biometrics),
    },
  });

  await prisma.dietPreference.upsert({
    where: { userId: localUserId },
    update: {
      dietStyle: input.dietStyle,
      allergies: input.allergies,
      avoidedFoods: input.avoidedFoods,
      preferredFoods: input.preferredFoods,
      dislikedFoods: input.dislikedFoods,
      budgetLevel: input.budgetLevel,
      maxCookingMinutes: input.maxCookingMinutes,
      mealsPerDay: input.mealsPerDay,
      notes: input.notes,
    },
    create: {
      userId: localUserId,
      dietStyle: input.dietStyle,
      allergies: input.allergies,
      avoidedFoods: input.avoidedFoods,
      preferredFoods: input.preferredFoods,
      dislikedFoods: input.dislikedFoods,
      budgetLevel: input.budgetLevel,
      maxCookingMinutes: input.maxCookingMinutes,
      mealsPerDay: input.mealsPerDay,
      notes: input.notes,
    },
  });

  return getProfileData();
}

export async function updateProfileFromForm(formData: FormData) {
  const input = profileUpdateSchema.parse(formDataToRecord(formData));
  await updateProfile(input);

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/food-log");
}

export async function createFoodEntry(input: FoodEntryCreateInput) {
  const prisma = requirePrisma();
  const user = await prisma.userProfile.findUnique({ where: { id: localUserId } });

  if (!user) {
    throw new Error("Save a profile before logging food.");
  }

  const eatenAt = new Date(`${input.date}T00:00:00`);
  const dailyLog = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: localUserId, date: eatenAt } },
    update: {},
    create: {
      userId: localUserId,
      date: eatenAt,
      trainingStatus: "REST",
    },
  });

  await prisma.foodEntry.create({
    data: {
      userId: localUserId,
      dailyLogId: dailyLog.id,
      eatenAt,
      mealType: mealToDb[input.mealType],
      foodName: input.foodName,
      quantity: input.quantity,
      unit: input.unit,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      source: input.source ?? "manual",
    },
  });

  return getFoodLogData(input.date);
}

export async function createFoodEntryFromForm(formData: FormData) {
  const input = foodEntryCreateSchema.parse(formDataToRecord(formData));
  await createFoodEntry(input);

  revalidatePath("/");
  revalidatePath("/food-log");
}
