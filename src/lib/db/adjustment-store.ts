import { revalidatePath } from "next/cache";
import {
  proposeCalorieAdjustment,
  proposeLoadAdjustments,
  proposeSetAdjustment,
  type ExerciseSessionResult,
} from "@/lib/domain/adjustments";
import { localDateString } from "@/lib/dates";
import { localUserId } from "@/lib/db/local-user";
import { requirePrisma } from "@/lib/db/prisma";

const goalFromDb = {
  FAT_LOSS: "fat_loss",
  MUSCLE_GAIN: "muscle_gain",
  MAINTENANCE: "maintenance",
  PERFORMANCE: "performance",
  RECOMPOSITION: "recomposition",
} as const;

export type AdjustmentRecord = {
  id: string;
  date: string;
  reason: string;
  field: string;
  subject: string;
  beforeValue: string;
  afterValue: string;
};

function refreshAdjustmentPages() {
  revalidatePath("/");
  revalidatePath("/program");
  revalidatePath("/training-log");
  revalidatePath("/food-log");
}

async function writeLog(input: {
  reason: string;
  field: string;
  subject: string;
  beforeValue: number | string;
  afterValue: number | string;
}) {
  const prisma = requirePrisma();
  const today = new Date(`${localDateString()}T00:00:00`);

  await prisma.adjustmentLog.create({
    data: {
      userId: localUserId,
      date: today,
      reason: input.reason,
      field: input.field,
      subject: input.subject,
      beforeValue: String(input.beforeValue),
      afterValue: String(input.afterValue),
    },
  });
}

export async function listAdjustments(): Promise<AdjustmentRecord[]> {
  const prisma = requirePrisma();
  const rows = await prisma.adjustmentLog.findMany({
    where: { userId: localUserId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return rows.map((row) => ({
    id: row.id,
    date: localDateString(row.date),
    reason: row.reason,
    field: row.field,
    subject: row.subject,
    beforeValue: row.beforeValue,
    afterValue: row.afterValue,
  }));
}

export async function applyRuleAdjustments() {
  const prisma = requirePrisma();
  const today = new Date(`${localDateString()}T00:00:00`);
  const lookback = new Date(today);
  lookback.setDate(lookback.getDate() - 28);

  const [loggedSets, library, goal, nutrition, metrics] = await Promise.all([
    prisma.exerciseSet.findMany({
      where: {
        plannedExerciseId: { not: null },
        trainingSession: { userId: localUserId, date: { gte: lookback } },
      },
      include: { plannedExercise: true, trainingSession: true },
      orderBy: { setNumber: "asc" },
    }),
    prisma.exercise.findMany(),
    prisma.goal.findFirst({ where: { userId: localUserId, isActive: true } }),
    prisma.nutritionTarget.findFirst({
      where: { userId: localUserId },
      orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.bodyMetric.findMany({
      where: { userId: localUserId, date: { gte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) } },
      orderBy: { date: "asc" },
    }),
  ]);
  const patternByName = new Map(library.map((exercise) => [exercise.name, exercise.movementPattern]));
  const sessions = new Map<string, ExerciseSessionResult>();

  for (const set of loggedSets) {
    const planned = set.plannedExercise;

    if (!planned) {
      continue;
    }

    const existing = sessions.get(planned.id) ?? {
      exerciseName: planned.exerciseName,
      movementPattern: patternByName.get(planned.exerciseName) ?? "other",
      date: localDateString(set.trainingSession.date),
      targetSets: planned.sets,
      targetRepsMin: planned.repsMin,
      targetRpe: planned.intensityValue,
      sets: [],
    };

    existing.sets.push({
      reps: set.reps,
      weightKg: set.weightKg ?? 0,
      rpe: set.rpe,
    });
    sessions.set(planned.id, existing);
  }

  const loadAdjustments = proposeLoadAdjustments([...sessions.values()]);

  for (const adjustment of loadAdjustments) {
    await prisma.plannedExercise.updateMany({
      where: {
        exerciseName: adjustment.subject,
        session: { userId: localUserId, date: { gte: today } },
      },
      data: { targetWeightKg: adjustment.afterValue },
    });
    await writeLog(adjustment);
  }

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const recentSets = loggedSets.filter(
    (set) => set.trainingSession.date >= weekAgo && set.rpe != null && set.plannedExercise,
  );
  const nextWeek = await prisma.program.findFirst({
    where: { userId: localUserId, level: "WEEK", startDate: { gt: today } },
    orderBy: { startDate: "asc" },
  });

  if (recentSets.length > 0 && nextWeek) {
    const averageRpe =
      recentSets.reduce((total, set) => total + (set.rpe ?? 0), 0) / recentSets.length;
    const targetRpe =
      recentSets.reduce((total, set) => total + (set.plannedExercise?.intensityValue ?? 8), 0) /
      recentSets.length;
    const nextSessions = await prisma.plannedSession.findMany({
      where: { programId: nextWeek.id },
      include: { exercises: true },
    });
    const nextExercises = nextSessions.flatMap((session) => session.exercises);
    const plannedSets = nextExercises.reduce((total, exercise) => total + exercise.sets, 0);
    const setAdjustment = proposeSetAdjustment({ averageRpe, targetRpe, plannedSets });

    if (setAdjustment) {
      for (const exercise of nextExercises) {
        const afterValue = Math.max(1, Math.round(exercise.sets * 0.8));

        if (afterValue === exercise.sets) {
          continue;
        }

        await prisma.plannedExercise.update({
          where: { id: exercise.id },
          data: { sets: afterValue },
        });
        await writeLog({
          reason: setAdjustment.reason,
          field: "sets",
          subject: exercise.id,
          beforeValue: exercise.sets,
          afterValue,
        });
      }
    }
  }

  if (goal && nutrition && metrics.length >= 2) {
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    const days = Math.max(
      1,
      Math.round((last.date.getTime() - first.date.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const calorieAdjustment = proposeCalorieAdjustment({
      goalType: goalFromDb[goal.type],
      startWeightKg: first.weightKg,
      endWeightKg: last.weightKg,
      days,
      calories: nutrition.calories,
    });

    if (calorieAdjustment) {
      const carbCalories = Math.max(
        0,
        calorieAdjustment.afterValue - nutrition.proteinG * 4 - nutrition.fatG * 9,
      );

      await prisma.nutritionTarget.create({
        data: {
          userId: localUserId,
          effectiveDate: today,
          calories: calorieAdjustment.afterValue,
          proteinG: nutrition.proteinG,
          fatG: nutrition.fatG,
          carbsG: Math.round((carbCalories / 4) * 10) / 10,
          formula: "adjustment",
        },
      });
      await writeLog(calorieAdjustment);
    }
  }

  refreshAdjustmentPages();
}

export async function rollbackLatestAdjustment() {
  const prisma = requirePrisma();
  const latest = await prisma.adjustmentLog.findFirst({
    where: { userId: localUserId },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return;
  }

  const today = new Date(`${localDateString()}T00:00:00`);
  const beforeValue = Number(latest.beforeValue);
  const afterValue = Number(latest.afterValue);

  if (latest.field === "weight") {
    await prisma.plannedExercise.updateMany({
      where: {
        exerciseName: latest.subject,
        session: { userId: localUserId, date: { gte: today } },
      },
      data: { targetWeightKg: beforeValue },
    });
  }

  if (latest.field === "sets") {
    await prisma.plannedExercise.update({
      where: { id: latest.subject },
      data: { sets: beforeValue },
    });
  }

  if (latest.field === "calories") {
    const nutrition = await prisma.nutritionTarget.findFirst({
      where: { userId: localUserId },
      orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    });

    if (nutrition) {
      const carbCalories = Math.max(0, beforeValue - nutrition.proteinG * 4 - nutrition.fatG * 9);

      await prisma.nutritionTarget.create({
        data: {
          userId: localUserId,
          effectiveDate: today,
          calories: beforeValue,
          proteinG: nutrition.proteinG,
          fatG: nutrition.fatG,
          carbsG: Math.round((carbCalories / 4) * 10) / 10,
          formula: "rollback",
        },
      });
    }
  }

  await writeLog({
    reason: `Rolled back: ${latest.reason}`,
    field: latest.field,
    subject: latest.subject,
    beforeValue: afterValue,
    afterValue: beforeValue,
  });
  refreshAdjustmentPages();
}
