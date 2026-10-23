export type ExerciseSetInput = {
  exerciseName: string;
  reps: number;
  weightKg?: number;
  rpe?: number;
};

export type TrainingSessionInput = {
  title: string;
  type: string;
  durationMin?: number;
  sets: ExerciseSetInput[];
};

export function calculateE1rm(weightKg: number, reps: number) {
  if (weightKg <= 0 || reps <= 0) {
    return null;
  }

  if (reps === 1) {
    return Math.round(weightKg * 10) / 10;
  }

  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export function sessionCompletionPercent(loggedSets: number, plannedSets: number) {
  if (plannedSets <= 0) {
    return null;
  }

  return Math.min(100, Math.round((loggedSets / plannedSets) * 100));
}

export function calculateTrainingVolume(session: TrainingSessionInput) {
  return session.sets.reduce((total, set) => {
    return total + set.reps * (set.weightKg ?? 0);
  }, 0);
}

export function countWorkingSets(session: TrainingSessionInput) {
  return session.sets.filter((set) => set.reps > 0).length;
}

export function summarizeTraining(session?: TrainingSessionInput) {
  if (!session) {
    return {
      label: "Rest day",
      volumeKg: 0,
      workingSets: 0,
      durationMin: 0,
    };
  }

  return {
    label: `${session.title} (${session.type})`,
    volumeKg: Math.round(calculateTrainingVolume(session)),
    workingSets: countWorkingSets(session),
    durationMin: session.durationMin ?? 0,
  };
}
