import { AppShell } from "@/components/AppShell";
import { DataError } from "@/components/DataError";
import { StatCard } from "@/components/StatCard";
import { createTrainingSetFromForm, getTrainingLogData } from "@/lib/db/app-data";
import { loadRecords } from "@/lib/db/load-records";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300";
const labelClass = "text-sm font-medium text-slate-300";

async function createTrainingSetAction(formData: FormData) {
  "use server";

  await createTrainingSetFromForm(formData);
}

export default async function TrainingLogPage() {
  const result = await loadRecords(() => getTrainingLogData());

  if (!result.ok) {
    return <DataError message={result.message} />;
  }

  const { date, sessions, exercises, plannedExercises, completionPercent } = result.data;
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
          <p className="mt-3 text-sm text-slate-400">
            Sessions stored for {date}.
            {completionPercent == null ? "" : ` Plan completion ${completionPercent}%.`}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Working sets" value={workingSets} />
            <StatCard label="Volume" value={`${volumeKg} kg`} />
            <StatCard label="Duration" value={`${durationMin} min`} />
          </div>
        </section>

        {plannedExercises.length > 0 ? (
          <section className="mt-8 rounded-[2rem] border border-white/10 p-6">
            <h3 className="text-xl font-semibold">Today&apos;s plan</h3>
            <div className="mt-4 space-y-3">
              {plannedExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex flex-col gap-1 rounded-2xl bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-white">{exercise.exerciseName}</span>
                  <span className="text-sm text-slate-300">
                    {exercise.sets} x {exercise.repsMin}-{exercise.repsMax} @ RPE {exercise.intensityValue}
                    {exercise.targetWeightKg == null ? "" : `, target ${exercise.targetWeightKg} kg`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <form
          action={createTrainingSetAction}
          className="mt-8 rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6"
        >
          <h3 className="text-xl font-semibold text-emerald-100">Add a set</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <label className={labelClass}>
              Date
              <input name="date" type="date" defaultValue={date} className={inputClass} required />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Exercise
              {plannedExercises.length > 0 ? (
                <select name="plannedExerciseId" className={inputClass} required defaultValue="">
                  <option value="" disabled>
                    Choose a planned exercise
                  </option>
                  {plannedExercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.exerciseName} {exercise.sets} x {exercise.repsMin}-{exercise.repsMax} RPE{" "}
                      {exercise.intensityValue}
                    </option>
                  ))}
                </select>
              ) : (
                <select name="exerciseName" className={inputClass} required defaultValue="">
                  <option value="" disabled>
                    Choose an exercise
                  </option>
                  {exercises.map((exercise) => (
                    <option key={exercise.name} value={exercise.name}>
                      {exercise.name} ({exercise.primaryMuscle})
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className={labelClass}>
              Reps
              <input name="reps" type="number" min="1" defaultValue="5" className={inputClass} required />
            </label>
            <label className={labelClass}>
              Weight kg
              <input name="weightKg" type="number" step="0.5" className={inputClass} />
            </label>
            <label className={labelClass}>
              RPE
              <input name="rpe" type="number" step="0.5" min="0" max="10" className={inputClass} />
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 rounded-full bg-emerald-300 px-6 py-3 font-semibold text-slate-950"
          >
            Add set
          </button>
        </form>

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
                      {set.reps} reps x {set.weightKg ?? 0} kg, RPE {set.rpe ?? "—"}, e1RM{" "}
                      {set.e1rmKg ?? "—"} kg
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
