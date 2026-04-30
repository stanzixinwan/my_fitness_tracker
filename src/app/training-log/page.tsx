import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { summarizeTraining } from "@/lib/domain/training";
import { plannedTraining } from "@/lib/sample-data";

export default function TrainingLogPage() {
  const summary = summarizeTraining(plannedTraining);

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Training
        </p>
        <h2 className="mt-3 text-3xl font-semibold">{plannedTraining.title}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Working sets" value={summary.workingSets} />
          <StatCard label="Volume" value={`${summary.volumeKg} kg`} />
          <StatCard label="Duration" value={`${summary.durationMin} min`} />
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 p-6">
        <h3 className="text-xl font-semibold">Planned sets</h3>
        <div className="mt-4 space-y-3">
          {plannedTraining.sets.map((set, index) => (
            <div
              key={`${set.exerciseName}-${index}`}
              className="flex flex-col gap-1 rounded-2xl bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-white">{set.exerciseName}</span>
              <span className="text-sm text-slate-300">
                {set.reps} reps x {set.weightKg ?? 0} kg, RPE {set.rpe ?? "-"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
