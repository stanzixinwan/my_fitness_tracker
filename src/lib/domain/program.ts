export type PlanGoal = "fat_loss" | "muscle_gain" | "maintenance";

export type PlannedExerciseDraft = {
  exerciseName: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  intensityType: "rpe";
  intensityValue: number;
  restSeconds: number;
};

export type PlannedSessionDraft = {
  date: string;
  theme: string;
  exercises: PlannedExerciseDraft[];
};

export type PlannedWeekDraft = {
  index: number;
  deload: boolean;
  startDate: string;
  endDate: string;
  sessions: PlannedSessionDraft[];
};

export type PlannedMesocycleDraft = {
  index: number;
  phaseType: "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
  startDate: string;
  endDate: string;
  weeks: PlannedWeekDraft[];
};

export type GeneratedProgram = {
  startDate: string;
  endDate: string;
  phaseType: PlannedMesocycleDraft["phaseType"];
  mesocycles: PlannedMesocycleDraft[];
};

type TemplateExercise = {
  exerciseName: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rpe: number;
  restSeconds: number;
};

const templates: Record<string, TemplateExercise[]> = {
  Upper: [
    { exerciseName: "Barbell Bench Press", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Barbell Row", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Overhead Press", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Lateral Raise", sets: 3, repsMin: 12, repsMax: 15, rpe: 9, restSeconds: 60 },
  ],
  Lower: [
    { exerciseName: "Back Squat", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Romanian Deadlift", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Walking Lunge", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 90 },
    { exerciseName: "Conventional Deadlift", sets: 3, repsMin: 5, repsMax: 5, rpe: 8, restSeconds: 180 },
  ],
  Push: [
    { exerciseName: "Barbell Bench Press", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Overhead Press", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Incline Dumbbell Press", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Lateral Raise", sets: 3, repsMin: 12, repsMax: 15, rpe: 9, restSeconds: 60 },
  ],
  Pull: [
    { exerciseName: "Barbell Row", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Pull-up", sets: 3, repsMin: 6, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Romanian Deadlift", sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSeconds: 120 },
    { exerciseName: "Lateral Raise", sets: 2, repsMin: 12, repsMax: 15, rpe: 8, restSeconds: 60 },
  ],
  Legs: [
    { exerciseName: "Back Squat", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Conventional Deadlift", sets: 3, repsMin: 5, repsMax: 5, rpe: 8, restSeconds: 180 },
    { exerciseName: "Walking Lunge", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 90 },
    { exerciseName: "Romanian Deadlift", sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSeconds: 120 },
  ],
  "Full A": [
    { exerciseName: "Back Squat", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Barbell Bench Press", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 180 },
    { exerciseName: "Barbell Row", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Lateral Raise", sets: 3, repsMin: 12, repsMax: 15, rpe: 8, restSeconds: 60 },
  ],
  "Full B": [
    { exerciseName: "Conventional Deadlift", sets: 3, repsMin: 5, repsMax: 5, rpe: 8, restSeconds: 180 },
    { exerciseName: "Overhead Press", sets: 4, repsMin: 6, repsMax: 8, rpe: 8, restSeconds: 150 },
    { exerciseName: "Pull-up", sets: 3, repsMin: 6, repsMax: 10, rpe: 8, restSeconds: 120 },
    { exerciseName: "Walking Lunge", sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSeconds: 90 },
  ],
};

function themesForDays(daysPerWeek: number) {
  const days = Math.min(6, Math.max(3, daysPerWeek));

  if (days <= 3) {
    return ["Full A", "Full B", "Full A"].slice(0, days);
  }

  if (days === 4) {
    return ["Upper", "Lower", "Upper", "Lower"];
  }

  if (days === 5) {
    return ["Push", "Pull", "Legs", "Upper", "Lower"];
  }

  return ["Push", "Pull", "Legs", "Push", "Pull", "Legs"];
}

function dayOffsets(count: number) {
  if (count <= 3) {
    return [0, 2, 4].slice(0, count);
  }

  if (count === 4) {
    return [0, 1, 3, 4];
  }

  if (count === 5) {
    return [0, 1, 2, 4, 5];
  }

  return [0, 1, 2, 3, 4, 5];
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toExercises(theme: string, deload: boolean): PlannedExerciseDraft[] {
  return templates[theme].map((exercise) => ({
    exerciseName: exercise.exerciseName,
    sets: deload ? 2 : exercise.sets,
    repsMin: exercise.repsMin,
    repsMax: exercise.repsMax,
    intensityType: "rpe",
    intensityValue: deload ? 6 : exercise.rpe,
    restSeconds: exercise.restSeconds,
  }));
}

export function generateProgram(input: {
  startDate: string;
  daysPerWeek: number;
  goalType: PlanGoal;
}): GeneratedProgram {
  const start = new Date(`${input.startDate}T00:00:00`);
  const end = addDays(start, 363);
  const phaseType =
    input.goalType === "fat_loss"
      ? "FAT_LOSS"
      : input.goalType === "muscle_gain"
        ? "MUSCLE_GAIN"
        : "MAINTENANCE";
  const themes = themesForDays(input.daysPerWeek);
  const offsets = dayOffsets(themes.length);
  const mesocycles: PlannedMesocycleDraft[] = [];
  let cursor = start;
  let mesoIndex = 1;

  while (cursor.getTime() <= end.getTime() && mesoIndex <= 12) {
    const weeks: PlannedWeekDraft[] = [];

    for (let week = 0; week < 5 && cursor.getTime() <= end.getTime(); week += 1) {
      const weekStart = cursor;
      const deload = week === 4;
      const sessions: PlannedSessionDraft[] = offsets
        .map((offset, index) => {
          const date = addDays(weekStart, offset);

          if (date.getTime() > end.getTime()) {
            return null;
          }

          return {
            date: formatDate(date),
            theme: themes[index],
            exercises: toExercises(themes[index], deload),
          };
        })
        .filter((session): session is PlannedSessionDraft => session != null);

      weeks.push({
        index: week + 1,
        deload,
        startDate: formatDate(weekStart),
        endDate: formatDate(addDays(weekStart, 6)),
        sessions,
      });
      cursor = addDays(weekStart, 7);
    }

    const mesoStart = weeks[0]?.startDate ?? formatDate(start);
    const mesoEnd = weeks[weeks.length - 1]?.endDate ?? mesoStart;

    mesocycles.push({
      index: mesoIndex,
      phaseType,
      startDate: mesoStart,
      endDate: mesoEnd,
      weeks,
    });
    mesoIndex += 1;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    phaseType,
    mesocycles,
  };
}

export function formatPlannedSession(session: PlannedSessionDraft, phaseLabel: string) {
  const lines = session.exercises.map((exercise, index) => {
    const reps =
      exercise.repsMin === exercise.repsMax
        ? `${exercise.sets} x ${exercise.repsMin}`
        : `${exercise.sets} x ${exercise.repsMin}–${exercise.repsMax}`;

    return `${index + 1}. ${exercise.exerciseName}  ${reps}  RPE ${exercise.intensityValue}  rest ${exercise.restSeconds}s`;
  });

  return [`Date: ${session.date} | ${phaseLabel} | ${session.theme}`, ...lines].join("\n");
}
