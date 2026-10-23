export type AdjustmentDraft = {
  reason: string;
  field: "weight" | "sets" | "calories";
  subject: string;
  beforeValue: number;
  afterValue: number;
};

export type ExerciseSessionResult = {
  exerciseName: string;
  movementPattern: string;
  date: string;
  targetSets: number;
  targetRepsMin: number;
  targetRpe: number;
  sets: { reps: number; weightKg: number; rpe: number | null }[];
};

function roundHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function capRelativeChange(current: number, next: number, maxPercent = 5) {
  const low = current * (1 - maxPercent / 100);
  const high = current * (1 + maxPercent / 100);

  return Math.min(high, Math.max(low, next));
}

export function bodyRegion(movementPattern: string) {
  return ["squat", "hinge", "lunge"].includes(movementPattern) ? "lower" : "upper";
}

function sessionStatus(session: ExerciseSessionResult) {
  if (session.sets.length < session.targetSets || session.sets.length === 0) {
    return session.sets.some((set) => set.reps < session.targetRepsMin) ? "missed" : "incomplete";
  }

  const completed = session.sets.every(
    (set) =>
      set.reps >= session.targetRepsMin && (set.rpe == null || set.rpe <= session.targetRpe),
  );

  return completed ? "completed" : "missed";
}

export function proposeLoadAdjustments(sessions: ExerciseSessionResult[]): AdjustmentDraft[] {
  const grouped = new Map<string, ExerciseSessionResult[]>();

  for (const session of sessions) {
    const existing = grouped.get(session.exerciseName) ?? [];
    existing.push(session);
    grouped.set(session.exerciseName, existing);
  }

  const adjustments: AdjustmentDraft[] = [];

  for (const [exerciseName, history] of grouped) {
    const recent = [...history].sort((left, right) => left.date.localeCompare(right.date)).slice(-2);

    if (recent.length < 2) {
      continue;
    }

    const statuses = recent.map(sessionStatus);
    const lastWeight = recent[1]?.sets.at(-1)?.weightKg;

    if (lastWeight == null || lastWeight <= 0) {
      continue;
    }

    if (statuses.every((status) => status === "completed")) {
      const increment = bodyRegion(recent[1].movementPattern) === "lower" ? 5 : 2.5;
      const afterValue = roundHalf(capRelativeChange(lastWeight, lastWeight + increment));

      if (afterValue !== lastWeight) {
        adjustments.push({
          reason: `${exerciseName} was completed twice at or below the target RPE`,
          field: "weight",
          subject: exerciseName,
          beforeValue: lastWeight,
          afterValue,
        });
      }
    }

    if (statuses.every((status) => status === "missed")) {
      const afterValue = roundHalf(capRelativeChange(lastWeight, lastWeight * 0.95));

      adjustments.push({
        reason: `${exerciseName} missed the target reps twice`,
        field: "weight",
        subject: exerciseName,
        beforeValue: lastWeight,
        afterValue,
      });
    }
  }

  return adjustments;
}

export function proposeSetAdjustment(input: {
  averageRpe: number;
  targetRpe: number;
  plannedSets: number;
}): AdjustmentDraft | null {
  if (input.averageRpe < input.targetRpe + 1 || input.plannedSets <= 0) {
    return null;
  }

  const afterValue = Math.max(1, Math.round(input.plannedSets * 0.8));

  return {
    reason: "Weekly RPE is at least 1 above target",
    field: "sets",
    subject: "next-week",
    beforeValue: input.plannedSets,
    afterValue,
  };
}

export function proposeCalorieAdjustment(input: {
  goalType: string;
  startWeightKg: number;
  endWeightKg: number;
  days: number;
  calories: number;
}): AdjustmentDraft | null {
  if (input.goalType !== "fat_loss" || input.days <= 0 || input.startWeightKg <= 0) {
    return null;
  }

  const weeklyLossPercent =
    ((input.startWeightKg - input.endWeightKg) / input.startWeightKg) * 100 * (7 / input.days);
  let next = input.calories;

  if (weeklyLossPercent < 0.25) {
    next = input.calories - 125;
  } else if (weeklyLossPercent > 1) {
    next = input.calories + 100;
  } else {
    return null;
  }

  const afterValue = Math.round(Math.max(input.calories - 150, Math.min(input.calories + 150, next)));

  return {
    reason:
      weeklyLossPercent < 0.25
        ? "Fat-loss weight change is slower than 0.25% per week"
        : "Fat-loss weight change is faster than 1% per week",
    field: "calories",
    subject: "nutrition-target",
    beforeValue: input.calories,
    afterValue,
  };
}
