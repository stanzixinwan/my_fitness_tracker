import { revalidatePath } from "next/cache";
import {
  foodEntryCreateSchema,
  profileUpdateSchema,
  type FoodEntryCreateInput,
  type ProfileUpdateInput,
} from "@/lib/api/schemas";
import {
  calculateMacroTargets,
  calculateRemainingNutrition,
  sumNutrition,
  type ActivityLevel,
  type GoalInput,
  type Sex,
} from "@/lib/domain/nutrition";
import { demoUserId, ensureDemoUser } from "@/lib/db/demo-user";
import { getPrisma } from "@/lib/db/prisma";
import {
  activeGoal,
  dietPreference,
  foodEntries,
  getTodayNutritionSnapshot,
  latestBodyMetric,
  sampleProfile,
  todayLog,
  type SampleFoodEntry,
} from "@/lib/sample-data";

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

export type ProfileData = {
  profile: typeof sampleProfile;
  latestBodyMetric: typeof latestBodyMetric;
  activeGoal: typeof activeGoal;
  dietPreference: typeof dietPreference;
  isPersisted: boolean;
};

export type FoodLogData = {
  foodEntries: SampleFoodEntry[];
  targets: ReturnType<typeof getTodayNutritionSnapshot>["targets"];
  consumed: ReturnType<typeof getTodayNutritionSnapshot>["consumed"];
  remaining: ReturnType<typeof getTodayNutritionSnapshot>["remaining"];
  isPersisted: boolean;
};

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function getProfileData(): Promise<ProfileData> {
  const prisma = getPrisma();

  if (!prisma) {
    return {
      profile: sampleProfile,
      latestBodyMetric,
      activeGoal,
      dietPreference,
      isPersisted: false,
    };
  }

  await ensureDemoUser(prisma);
  const user = await prisma.userProfile.findUniqueOrThrow({
    where: { id: demoUserId },
    include: {
      bodyMetrics: { orderBy: { date: "desc" }, take: 1 },
      goals: { where: { isActive: true }, orderBy: { priority: "asc" }, take: 1 },
      dietPreference: true,
    },
  });
  const metric = user.bodyMetrics[0];
  const goal = user.goals[0];

  return {
    profile: {
      id: user.id,
      displayName: user.displayName,
      sex: sexFromDb[user.sex] as Sex,
      birthYear: user.birthYear ?? sampleProfile.birthYear,
      heightCm: user.heightCm,
      activityLevel: activityFromDb[user.activityLevel] as ActivityLevel,
      trainingExperience: user.trainingExperience ?? "",
      defaultWakeTime: user.defaultWakeTime ?? "",
      defaultSleepTime: user.defaultSleepTime ?? "",
    },
    latestBodyMetric: {
      date: metric.date.toISOString().slice(0, 10),
      weightKg: metric.weightKg,
      bodyFatPercent: metric.bodyFatPercent ?? latestBodyMetric.bodyFatPercent,
      waistCm: metric.waistCm ?? latestBodyMetric.waistCm,
    },
    activeGoal: {
      type: goalFromDb[goal.type] as GoalInput["type"],
      title: goal.title,
      targetWeightKg: goal.targetWeightKg ?? activeGoal.targetWeightKg,
      weeklyWeightDeltaKg: goal.weeklyWeightDeltaKg ?? activeGoal.weeklyWeightDeltaKg,
      endDate: goal.endDate?.toISOString().slice(0, 10) ?? activeGoal.endDate,
    },
    dietPreference: {
      dietStyle: user.dietPreference?.dietStyle ?? "",
      allergies: user.dietPreference?.allergies ?? [],
      avoidedFoods: user.dietPreference?.avoidedFoods ?? [],
      preferredFoods: user.dietPreference?.preferredFoods ?? [],
      dislikedFoods: user.dietPreference?.dislikedFoods ?? [],
      budgetLevel: user.dietPreference?.budgetLevel ?? "",
      maxCookingMinutes: user.dietPreference?.maxCookingMinutes ?? 30,
      mealsPerDay: user.dietPreference?.mealsPerDay ?? 3,
      notes: user.dietPreference?.notes ?? "",
    },
    isPersisted: true,
  };
}

export async function getFoodLogData(): Promise<FoodLogData> {
  const prisma = getPrisma();

  if (!prisma) {
    return {
      ...getTodayNutritionSnapshot(),
      foodEntries,
      isPersisted: false,
    };
  }

  const profileData = await getProfileData();
  const rows = await prisma.foodEntry.findMany({
    where: {
      userId: demoUserId,
      eatenAt: {
        gte: new Date(`${todayLog.date}T00:00:00.000Z`),
        lt: new Date(`${todayLog.date}T23:59:59.999Z`),
      },
    },
    orderBy: { eatenAt: "asc" },
  });
  const mappedEntries: SampleFoodEntry[] = rows.map((entry) => ({
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
  const biometrics = {
    ...profileData.profile,
    weightKg: profileData.latestBodyMetric.weightKg,
  };
  const targets = calculateMacroTargets(biometrics, profileData.activeGoal);
  const consumed = sumNutrition(mappedEntries);

  return {
    foodEntries: mappedEntries,
    targets,
    consumed,
    remaining: calculateRemainingNutrition(targets, consumed),
    isPersisted: true,
  };
}

export async function updateProfile(input: ProfileUpdateInput) {
  const prisma = getPrisma();

  if (!prisma) {
    return getProfileData();
  }

  await ensureDemoUser(prisma);

  await prisma.userProfile.update({
    where: { id: demoUserId },
    data: {
      displayName: input.displayName,
      birthYear: input.birthYear,
      sex: sexToDb[input.sex],
      heightCm: input.heightCm,
      activityLevel: activityToDb[input.activityLevel],
      trainingExperience: input.trainingExperience,
      defaultWakeTime: input.defaultWakeTime,
      defaultSleepTime: input.defaultSleepTime,
    },
  });

  await prisma.bodyMetric.upsert({
    where: {
      userId_date: {
        userId: demoUserId,
        date: new Date(input.metricDate),
      },
    },
    update: {
      weightKg: input.weightKg,
      bodyFatPercent: input.bodyFatPercent,
      waistCm: input.waistCm,
    },
    create: {
      userId: demoUserId,
      date: new Date(input.metricDate),
      weightKg: input.weightKg,
      bodyFatPercent: input.bodyFatPercent,
      waistCm: input.waistCm,
    },
  });

  await prisma.dietPreference.upsert({
    where: { userId: demoUserId },
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
      userId: demoUserId,
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
}

export async function createFoodEntry(input: FoodEntryCreateInput) {
  const prisma = getPrisma();

  if (!prisma) {
    return getFoodLogData();
  }

  await ensureDemoUser(prisma);
  const dailyLog = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: demoUserId, date: new Date(input.date) } },
    update: {},
    create: {
      userId: demoUserId,
      date: new Date(input.date),
      trainingStatus: "REST",
    },
  });

  await prisma.foodEntry.create({
    data: {
      userId: demoUserId,
      dailyLogId: dailyLog.id,
      eatenAt: new Date(input.date),
      mealType: mealToDb[input.mealType],
      foodName: input.foodName,
      quantity: input.quantity,
      unit: input.unit,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      source: "manual",
    },
  });

  return getFoodLogData();
}

export async function createFoodEntryFromForm(formData: FormData) {
  const input = foodEntryCreateSchema.parse(formDataToRecord(formData));
  await createFoodEntry(input);

  revalidatePath("/");
  revalidatePath("/food-log");
}
