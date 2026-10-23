import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { localUserId } from "../src/lib/db/local-user";
import { calculateMacroTargets, nutritionFormula } from "../src/lib/domain/nutrition";

const metricDate = new Date("2026-04-30T00:00:00");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await prisma.userProfile.upsert({
    where: { id: localUserId },
    update: {},
    create: {
      id: localUserId,
      displayName: "Stan",
      birthYear: 1996,
      birthDate: new Date("1996-04-12T00:00:00"),
      injuryHistory: "",
      sex: "MALE",
      heightCm: 178,
      activityLevel: "MODERATE",
      trainingExperience:
        "Consistent strength training for 2 years, 4 sessions per week, prefers afternoon or evening workouts.",
      defaultWakeTime: "08:00",
      defaultSleepTime: "00:00",
    },
  });

  await prisma.bodyMetric.upsert({
    where: {
      userId_date: {
        userId: localUserId,
        date: metricDate,
      },
    },
    update: {},
    create: {
      userId: localUserId,
      date: metricDate,
      weightKg: 78.4,
      bodyFatPercent: 18.5,
      leanBodyMassKg: 63.9,
      waistCm: 84,
      source: "seed",
    },
  });

  await prisma.goal.upsert({
    where: { id: "demo-goal" },
    update: {},
    create: {
      id: "demo-goal",
      userId: localUserId,
      type: "RECOMPOSITION",
      title: "Slow fat loss while maintaining strength performance",
      targetWeightKg: 75,
      weeklyWeightDeltaKg: -0.25,
      startDate: metricDate,
      endDate: new Date("2026-08-01T00:00:00"),
      isActive: true,
    },
  });

  const seedBiometrics = {
    sex: "male" as const,
    birthYear: 1996,
    heightCm: 178,
    weightKg: 78.4,
    activityLevel: "moderate" as const,
    bodyFatPercent: 18.5,
    leanBodyMassKg: 63.9,
  };
  const seedTargets = calculateMacroTargets(seedBiometrics, { type: "recomposition" });

  await prisma.nutritionTarget.deleteMany({ where: { userId: localUserId } });
  await prisma.nutritionTarget.create({
    data: {
      userId: localUserId,
      effectiveDate: metricDate,
      calories: seedTargets.calories,
      proteinG: seedTargets.proteinG,
      carbsG: seedTargets.carbsG,
      fatG: seedTargets.fatG,
      formula: nutritionFormula(seedBiometrics),
    },
  });

  await prisma.dietPreference.upsert({
    where: { userId: localUserId },
    update: {},
    create: {
      userId: localUserId,
      dietStyle: "High protein, easy to prepare, carbs not overly restricted",
      allergies: ["No known allergies"],
      avoidedFoods: ["Fried food", "Sugary drinks"],
      preferredFoods: ["Chicken breast", "Eggs", "Greek yogurt", "Rice", "Beef", "Broccoli"],
      dislikedFoods: ["Celery"],
      budgetLevel: "Medium",
      maxCookingMinutes: 30,
      mealsPerDay: 3,
      notes: "Prefer stable, repeatable meals.",
    },
  });

  const dailyLog = await prisma.dailyLog.upsert({
    where: {
      userId_date: {
        userId: localUserId,
        date: metricDate,
      },
    },
    update: {},
    create: {
      userId: localUserId,
      date: metricDate,
      sleepHours: 7,
      stressLevel: 3,
      scheduleNote: "Strength training at 6 PM.",
      trainingStatus: "PLANNED",
    },
  });

  const foods = [
    {
      id: "breakfast-1",
      mealType: "BREAKFAST" as const,
      foodName: "Oats 60g + milk 250ml + 2 eggs",
      calories: 560,
      proteinG: 31,
      carbsG: 62,
      fatG: 20,
    },
    {
      id: "lunch-1",
      mealType: "LUNCH" as const,
      foodName: "Chicken breast rice bowl",
      calories: 720,
      proteinG: 52,
      carbsG: 86,
      fatG: 16,
    },
  ];

  for (const entry of foods) {
    await prisma.foodEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        userId: localUserId,
        dailyLogId: dailyLog.id,
        eatenAt: metricDate,
        mealType: entry.mealType,
        foodName: entry.foodName,
        quantity: 1,
        unit: "serving",
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        source: "seed",
      },
    });
  }

  const exercises = [
    ["Barbell Bench Press", "chest", "horizontal push", "barbell"],
    ["Incline Dumbbell Press", "chest", "horizontal push", "dumbbell"],
    ["Overhead Press", "shoulders", "vertical push", "barbell"],
    ["Barbell Row", "back", "horizontal pull", "barbell"],
    ["Pull-up", "back", "vertical pull", "bodyweight"],
    ["Back Squat", "quads", "squat", "barbell"],
    ["Romanian Deadlift", "hamstrings", "hinge", "barbell"],
    ["Conventional Deadlift", "posterior chain", "hinge", "barbell"],
    ["Walking Lunge", "quads", "lunge", "dumbbell"],
    ["Lateral Raise", "shoulders", "raise", "dumbbell"],
  ] as const;

  for (const [name, primaryMuscle, movementPattern, equipment] of exercises) {
    await prisma.exercise.upsert({
      where: { name },
      update: { primaryMuscle, movementPattern, equipment },
      create: { name, primaryMuscle, movementPattern, equipment },
    });
  }

  await prisma.trainingSession.upsert({
    where: { id: "demo-training" },
    update: {},
    create: {
      id: "demo-training",
      userId: localUserId,
      date: metricDate,
      title: "Upper Strength",
      type: "strength",
      durationMin: 70,
      sets: {
        create: [
          { exerciseName: "Bench Press", setNumber: 1, reps: 5, weightKg: 82.5, rpe: 8 },
          { exerciseName: "Bench Press", setNumber: 2, reps: 5, weightKg: 82.5, rpe: 8 },
          { exerciseName: "Barbell Row", setNumber: 3, reps: 8, weightKg: 75, rpe: 8 },
          { exerciseName: "Overhead Press", setNumber: 4, reps: 6, weightKg: 50, rpe: 7.5 },
        ],
      },
    },
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
