import { revalidatePath } from "next/cache";
import { programGenerateSchema, type ProgramGenerateInput } from "@/lib/api/schemas";
import { localDateString, localDayRange } from "@/lib/dates";
import { formatPlannedSession, generateProgram, type PlanGoal } from "@/lib/domain/program";
import { getProfileData } from "@/lib/db/app-data";
import { localUserId } from "@/lib/db/local-user";
import { requirePrisma } from "@/lib/db/prisma";

function planGoal(type: string | undefined): PlanGoal {
  if (type === "fat_loss" || type === "muscle_gain" || type === "maintenance") {
    return type;
  }

  return "maintenance";
}

export async function generateStoredProgram(input: ProgramGenerateInput) {
  const prisma = requirePrisma();
  const profile = await getProfileData();

  if (!profile.hasProfile) {
    throw new Error("Save a profile before generating a program.");
  }

  const goal = planGoal(profile.activeGoal?.type);
  const generated = generateProgram({
    startDate: input.startDate,
    daysPerWeek: input.daysPerWeek,
    goalType: goal,
  });
  const start = new Date(`${generated.startDate}T00:00:00`);
  const end = new Date(`${generated.endDate}T00:00:00`);

  await prisma.program.deleteMany({
    where: { userId: localUserId, parentId: null },
  });

  const year = await prisma.program.create({
    data: {
      userId: localUserId,
      level: "YEAR",
      phaseType: generated.phaseType,
      title: "Annual plan",
      startDate: start,
      endDate: end,
    },
  });

  for (const meso of generated.mesocycles) {
    const mesoRow = await prisma.program.create({
      data: {
        userId: localUserId,
        parentId: year.id,
        level: "MONTH",
        phaseType: meso.phaseType,
        title: `${meso.phaseType} M${meso.index}`,
        startDate: new Date(`${meso.startDate}T00:00:00`),
        endDate: new Date(`${meso.endDate}T00:00:00`),
      },
    });

    for (const week of meso.weeks) {
      const weekRow = await prisma.program.create({
        data: {
          userId: localUserId,
          parentId: mesoRow.id,
          level: "WEEK",
          phaseType: week.deload ? "DELOAD" : meso.phaseType,
          title: week.deload ? `M${meso.index} deload` : `M${meso.index} week ${week.index}`,
          startDate: new Date(`${week.startDate}T00:00:00`),
          endDate: new Date(`${week.endDate}T00:00:00`),
        },
      });

      for (const session of week.sessions) {
        await prisma.plannedSession.create({
          data: {
            userId: localUserId,
            programId: weekRow.id,
            date: new Date(`${session.date}T00:00:00`),
            theme: session.theme,
            exercises: {
              create: session.exercises.map((exercise, index) => ({
                exerciseName: exercise.exerciseName,
                sortOrder: index + 1,
                sets: exercise.sets,
                repsMin: exercise.repsMin,
                repsMax: exercise.repsMax,
                intensityType: exercise.intensityType,
                intensityValue: exercise.intensityValue,
                restSeconds: exercise.restSeconds,
              })),
            },
          },
        });
      }
    }
  }

  return getTodayPlan(input.startDate);
}

export async function generateProgramFromForm(formData: FormData) {
  const input = programGenerateSchema.parse(Object.fromEntries(formData.entries()));
  await generateStoredProgram(input);
  revalidatePath("/program");
  revalidatePath("/");
}

export async function getTodayPlan(date = localDateString()) {
  const prisma = requirePrisma();
  const range = localDayRange(date);
  const session = await prisma.plannedSession.findFirst({
    where: { userId: localUserId, date: range },
    include: {
      exercises: { orderBy: { sortOrder: "asc" } },
      program: { include: { parent: true } },
    },
  });

  if (!session) {
    return { date, text: null as string | null, theme: null as string | null };
  }

  const phaseLabel = session.program.parent?.title ?? session.program.title;
  const draft = {
    date: localDateString(session.date),
    theme: session.theme,
    exercises: session.exercises.map((exercise) => ({
      exerciseName: exercise.exerciseName,
      sets: exercise.sets,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      intensityType: "rpe" as const,
      intensityValue: exercise.intensityValue,
      restSeconds: exercise.restSeconds,
    })),
  };

  return {
    date,
    theme: session.theme,
    text: formatPlannedSession(draft, phaseLabel),
  };
}
