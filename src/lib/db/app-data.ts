import { revalidatePath } from "next/cache";
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

function splitCsv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

export async function updateProfileFromForm(formData: FormData) {
  const prisma = getPrisma();

  if (!prisma) {
    return;
  }

  await ensureDemoUser(prisma);
  const sex = String(formData.get("sex") ?? "unspecified") as Sex;
  const activityLevel = String(formData.get("activityLevel") ?? "moderate") as ActivityLevel;
  const metricDate = String(formData.get("metricDate") ?? todayLog.date);

  await prisma.userProfile.update({
    where: { id: demoUserId },
    data: {
      displayName: String(formData.get("displayName") ?? sampleProfile.displayName),
      birthYear: Math.round(toNumber(formData.get("birthYear"), sampleProfile.birthYear)),
      sex: sexToDb[sex],
      heightCm: toNumber(formData.get("heightCm"), sampleProfile.heightCm),
      activityLevel: activityToDb[activityLevel],
      trainingExperience: String(formData.get("trainingExperience") ?? ""),
      defaultWakeTime: String(formData.get("defaultWakeTime") ?? ""),
      defaultSleepTime: String(formData.get("defaultSleepTime") ?? ""),
    },
  });

  await prisma.bodyMetric.upsert({
    where: {
      userId_date: {
        userId: demoUserId,
        date: new Date(metricDate),
      },
    },
    update: {
      weightKg: toNumber(formData.get("weightKg"), latestBodyMetric.weightKg),
      bodyFatPercent: toNumber(formData.get("bodyFatPercent"), latestBodyMetric.bodyFatPercent),
      waistCm: toNumber(formData.get("waistCm"), latestBodyMetric.waistCm),
    },
    create: {
      userId: demoUserId,
      date: new Date(metricDate),
      weightKg: toNumber(formData.get("weightKg"), latestBodyMetric.weightKg),
      bodyFatPercent: toNumber(formData.get("bodyFatPercent"), latestBodyMetric.bodyFatPercent),
      waistCm: toNumber(formData.get("waistCm"), latestBodyMetric.waistCm),
    },
  });

  await prisma.dietPreference.upsert({
    where: { userId: demoUserId },
    update: {
      dietStyle: String(formData.get("dietStyle") ?? ""),
      allergies: splitCsv(formData.get("allergies")),
      avoidedFoods: splitCsv(formData.get("avoidedFoods")),
      preferredFoods: splitCsv(formData.get("preferredFoods")),
      dislikedFoods: splitCsv(formData.get("dislikedFoods")),
      budgetLevel: String(formData.get("budgetLevel") ?? ""),
      maxCookingMinutes: Math.round(toNumber(formData.get("maxCookingMinutes"), 30)),
      mealsPerDay: Math.round(toNumber(formData.get("mealsPerDay"), 3)),
      notes: String(formData.get("notes") ?? ""),
    },
    create: {
      userId: demoUserId,
      dietStyle: String(formData.get("dietStyle") ?? ""),
      allergies: splitCsv(formData.get("allergies")),
      avoidedFoods: splitCsv(formData.get("avoidedFoods")),
      preferredFoods: splitCsv(formData.get("preferredFoods")),
      dislikedFoods: splitCsv(formData.get("dislikedFoods")),
      budgetLevel: String(formData.get("budgetLevel") ?? ""),
      maxCookingMinutes: Math.round(toNumber(formData.get("maxCookingMinutes"), 30)),
      mealsPerDay: Math.round(toNumber(formData.get("mealsPerDay"), 3)),
      notes: String(formData.get("notes") ?? ""),
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
}

export async function createFoodEntryFromForm(formData: FormData) {
  const prisma = getPrisma();

  if (!prisma) {
    return;
  }

  await ensureDemoUser(prisma);
  const date = String(formData.get("date") ?? todayLog.date);
  const dailyLog = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: demoUserId, date: new Date(date) } },
    update: {},
    create: {
      userId: demoUserId,
      date: new Date(date),
      trainingStatus: "REST",
    },
  });
  const mealType = String(formData.get("mealType") ?? "snack") as keyof typeof mealToDb;

  await prisma.foodEntry.create({
    data: {
      userId: demoUserId,
      dailyLogId: dailyLog.id,
      eatenAt: new Date(date),
      mealType: mealToDb[mealType],
      foodName: String(formData.get("foodName") ?? "Untitled food"),
      quantity: toNumber(formData.get("quantity"), 1),
      unit: String(formData.get("unit") ?? "serving"),
      calories: toNumber(formData.get("calories")),
      proteinG: toNumber(formData.get("proteinG")),
      carbsG: toNumber(formData.get("carbsG")),
      fatG: toNumber(formData.get("fatG")),
      source: "manual",
    },
  });

  revalidatePath("/");
  revalidatePath("/food-log");
}
