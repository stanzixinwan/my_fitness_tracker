import type { PrismaClient } from "@/generated/prisma/client";
import {
  activeGoal,
  dietPreference,
  foodEntries,
  latestBodyMetric,
  plannedTraining,
  sampleProfile,
  todayLog,
} from "@/lib/sample-data";

export const demoUserId = "demo-user";

const mealTypeMap = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
  snack: "SNACK",
} as const;

export async function ensureDemoUser(prisma: PrismaClient) {
  const user = await prisma.userProfile.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      displayName: sampleProfile.displayName,
      birthYear: sampleProfile.birthYear,
      sex: "MALE",
      heightCm: sampleProfile.heightCm,
      activityLevel: "MODERATE",
      trainingExperience: sampleProfile.trainingExperience,
      defaultWakeTime: sampleProfile.defaultWakeTime,
      defaultSleepTime: sampleProfile.defaultSleepTime,
    },
  });

  await prisma.bodyMetric.upsert({
    where: {
      userId_date: {
        userId: demoUserId,
        date: new Date(latestBodyMetric.date),
      },
    },
    update: {
      weightKg: latestBodyMetric.weightKg,
      bodyFatPercent: latestBodyMetric.bodyFatPercent,
      waistCm: latestBodyMetric.waistCm,
    },
    create: {
      userId: demoUserId,
      date: new Date(latestBodyMetric.date),
      weightKg: latestBodyMetric.weightKg,
      bodyFatPercent: latestBodyMetric.bodyFatPercent,
      waistCm: latestBodyMetric.waistCm,
    },
  });

  await prisma.goal.upsert({
    where: { id: "demo-goal" },
    update: {},
    create: {
      id: "demo-goal",
      userId: demoUserId,
      type: "RECOMPOSITION",
      title: activeGoal.title,
      targetWeightKg: activeGoal.targetWeightKg,
      weeklyWeightDeltaKg: activeGoal.weeklyWeightDeltaKg,
      startDate: new Date(todayLog.date),
      endDate: new Date(activeGoal.endDate),
      isActive: true,
    },
  });

  await prisma.dietPreference.upsert({
    where: { userId: demoUserId },
    update: {},
    create: {
      userId: demoUserId,
      dietStyle: dietPreference.dietStyle,
      allergies: dietPreference.allergies,
      avoidedFoods: dietPreference.avoidedFoods,
      preferredFoods: dietPreference.preferredFoods,
      dislikedFoods: dietPreference.dislikedFoods,
      budgetLevel: dietPreference.budgetLevel,
      maxCookingMinutes: dietPreference.maxCookingMinutes,
      mealsPerDay: dietPreference.mealsPerDay,
      notes: dietPreference.notes,
    },
  });

  const dailyLog = await prisma.dailyLog.upsert({
    where: {
      userId_date: {
        userId: demoUserId,
        date: new Date(todayLog.date),
      },
    },
    update: {},
    create: {
      userId: demoUserId,
      date: new Date(todayLog.date),
      sleepHours: todayLog.sleepHours,
      stressLevel: todayLog.stressLevel,
      scheduleNote: todayLog.scheduleNote,
      trainingStatus: "PLANNED",
    },
  });

  for (const entry of foodEntries) {
    await prisma.foodEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        userId: demoUserId,
        dailyLogId: dailyLog.id,
        eatenAt: new Date(todayLog.date),
        mealType: mealTypeMap[entry.mealType],
        foodName: entry.foodName,
        quantity: entry.quantity,
        unit: entry.unit,
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        source: "seed",
      },
    });
  }

  await prisma.trainingSession.upsert({
    where: { id: "demo-training" },
    update: {},
    create: {
      id: "demo-training",
      userId: demoUserId,
      date: new Date(todayLog.date),
      title: plannedTraining.title,
      type: plannedTraining.type,
      durationMin: plannedTraining.durationMin,
      sets: {
        create: plannedTraining.sets.map((set, index) => ({
          exerciseName: set.exerciseName,
          setNumber: index + 1,
          reps: set.reps,
          weightKg: set.weightKg,
          rpe: set.rpe,
        })),
      },
    },
  });

  return user;
}
