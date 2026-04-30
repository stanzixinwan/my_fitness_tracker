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
