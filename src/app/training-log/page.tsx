import { AppShell } from "@/components/AppShell";
import { DataError } from "@/components/DataError";
import { StatCard } from "@/components/StatCard";
import { getTrainingLogData } from "@/lib/db/app-data";
import { loadRecords } from "@/lib/db/load-records";

export default async function TrainingLogPage() {
  const result = await loadRecords(() => getTrainingLogData());

  if (!result.ok) {
    return <DataError message={result.message} />;
  }

  const { date, sessions } = result.data;
  const workingSets = sessions.reduce((total, session) => total + session.workingSets, 0);
  const volumeKg = sessions.reduce((total, session) => total + session.volumeKg, 0);
  const durationMin = sessions.reduce((total, session) => total + (session.durationMin ?? 0), 0);

  return (
      <AppShell>
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Training</p>
          <h2 className="mt-3 text-3xl font-semibold">
            {sessions.length > 0 ? sessions.map((session) => session.title).join(", ") : "No session"}
          </h2>
          <p className="mt-3 text-sm text-slate-400">Sessions stored for {date}.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Working sets" value={workingSets} />
            <StatCard label="Volume" value={`${volumeKg} kg`} />
            <StatCard label="Duration" value={`${durationMin} min`} />
          </div>
        </section>

        {sessions.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-white/10 p-6">
            <h3 className="text-xl font-semibold">Logged sets</h3>
            <p className="mt-4 text-sm text-slate-400">No training logged for {date}.</p>
          </section>
        ) : (
          sessions.map((session) => (
            <section key={session.id} className="mt-8 rounded-[2rem] border border-white/10 p-6">
              <h3 className="text-xl font-semibold">
                {session.title} ({session.type})
              </h3>
              <div className="mt-4 space-y-3">
                {session.sets.map((set, index) => (
                  <div
                    key={`${session.id}-${set.exerciseName}-${index}`}
                    className="flex flex-col gap-1 rounded-2xl bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-white">{set.exerciseName}</span>
                    <span className="text-sm text-slate-300">
                      {set.reps} reps x {set.weightKg ?? 0} kg, RPE {set.rpe ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </AppShell>
    );
}
