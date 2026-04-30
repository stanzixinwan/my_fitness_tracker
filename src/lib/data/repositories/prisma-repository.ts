import type { PrismaClient } from "@/generated/prisma/client";
import type { FoodEntryCreateInput, ProfileUpdateInput } from "@/lib/api/schemas";
import { demoUserId, ensureDemoUser } from "@/lib/db/demo-user";
import type { FitnessRepository } from "@/lib/data/repository";
import type {
  CreatePlanSuggestionInput,
  FoodEntryRecord,
  GoalTypeRecord,
  PlanSuggestionRecord,
  ProfileBundle,
} from "@/lib/data/types";
import { activeGoal, latestBodyMetric, sampleProfile } from "@/lib/sample-data";

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

export class PrismaRepository implements FitnessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfileBundle(): Promise<ProfileBundle> {
    await ensureDemoUser(this.prisma);
    const user = await this.prisma.userProfile.findUniqueOrThrow({
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
        sex: sexFromDb[user.sex],
        birthYear: user.birthYear ?? sampleProfile.birthYear,
        heightCm: user.heightCm,
        activityLevel: activityFromDb[user.activityLevel],
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
        type: goalFromDb[goal.type] as GoalTypeRecord,
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

  async updateProfileBundle(input: ProfileUpdateInput): Promise<ProfileBundle> {
    await ensureDemoUser(this.prisma);

    await this.prisma.userProfile.update({
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

    await this.prisma.bodyMetric.upsert({
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

    await this.prisma.dietPreference.upsert({
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

    return this.getProfileBundle();
  }

  async listFoodEntries(date: string): Promise<FoodEntryRecord[]> {
    await ensureDemoUser(this.prisma);
    const rows = await this.prisma.foodEntry.findMany({
      where: {
        userId: demoUserId,
        eatenAt: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`),
        },
      },
      orderBy: { eatenAt: "asc" },
    });

    return rows.map((entry) => ({
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
  }

  async createFoodEntry(input: FoodEntryCreateInput): Promise<FoodEntryRecord> {
    await ensureDemoUser(this.prisma);
    const dailyLog = await this.prisma.dailyLog.upsert({
      where: { userId_date: { userId: demoUserId, date: new Date(input.date) } },
      update: {},
      create: {
        userId: demoUserId,
        date: new Date(input.date),
        trainingStatus: "REST",
      },
    });

    const entry = await this.prisma.foodEntry.create({
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

    return {
      id: entry.id,
      mealType: mealFromDb[entry.mealType],
      foodName: entry.foodName,
      quantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      proteinG: entry.proteinG,
      carbsG: entry.carbsG,
      fatG: entry.fatG,
    };
  }

  async listPlanSuggestions(limit = 10): Promise<PlanSuggestionRecord[]> {
    await ensureDemoUser(this.prisma);
    const rows = await this.prisma.planSuggestion.findMany({
      where: { userId: demoUserId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      model: row.model,
      inputSummary: row.inputSummary as Record<string, unknown>,
      suggestion: row.suggestion as PlanSuggestionRecord["suggestion"],
      status: row.status.toLowerCase() as PlanSuggestionRecord["status"],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createPlanSuggestion(
    input: CreatePlanSuggestionInput,
  ): Promise<PlanSuggestionRecord> {
    await ensureDemoUser(this.prisma);
    const saved = await this.prisma.planSuggestion.create({
      data: {
        userId: demoUserId,
        date: new Date(input.date),
        model: input.model,
        inputSummary: JSON.parse(JSON.stringify(input.inputSummary)),
        suggestion: JSON.parse(JSON.stringify(input.suggestion)),
        status: "DRAFT",
      },
    });

    return {
      id: saved.id,
      date: saved.date.toISOString().slice(0, 10),
      model: saved.model,
      inputSummary: saved.inputSummary as Record<string, unknown>,
      suggestion: saved.suggestion as PlanSuggestionRecord["suggestion"],
      status: "draft",
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
