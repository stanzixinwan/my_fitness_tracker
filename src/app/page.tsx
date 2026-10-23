import { AppShell } from "@/components/AppShell";
import { DataError } from "@/components/DataError";
import { StatCard } from "@/components/StatCard";
import { getFoodLogData, getProfileData, getTrainingLogData } from "@/lib/db/app-data";
import { loadRecords } from "@/lib/db/load-records";
import { completionPercent } from "@/lib/domain/nutrition";

export default async function Home() {
  const result = await loadRecords(async () => {
    const [profileData, foodLogData, trainingData] = await Promise.all([
      getProfileData(),
      getFoodLogData(),
      getTrainingLogData(),
    ]);

    return { profileData, foodLogData, trainingData };
  });

  if (!result.ok) {
    return <DataError message={result.message} />;
  }

  const { profileData, foodLogData, trainingData } = result.data;
  const { targets, consumed, remaining, foodEntries } = foodLogData;
  const { profile, activeGoal, hasProfile, recentWeightAverageKg, latestBodyMetric } =
    profileData;
  const session = trainingData.sessions[0];
  const proteinCompletion =
    targets == null ? null : completionPercent(consumed.proteinG, targets.proteinG);

  return (
      <AppShell>
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Today</p>
            <h2 className="mt-3 text-4xl font-semibold">
              {hasProfile ? profile.displayName : "No profile saved yet"}
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              {activeGoal
                ? `Goal: ${activeGoal.title}.`
                : "Save a profile and body weight before calorie targets can be calculated."}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Remaining calories"
                value={remaining ? `${remaining.calories} kcal` : "—"}
                detail={
                  targets
                    ? `Target ${targets.calories} kcal, eaten ${consumed.calories} kcal`
                    : "Targets need a profile, weight, and active goal"
                }
              />
              <StatCard
                label="Protein progress"
                value={proteinCompletion == null ? "—" : `${proteinCompletion}%`}
                detail={
                  targets
                    ? `${consumed.proteinG}g / ${targets.proteinG}g`
                    : `${consumed.proteinG}g logged`
                }
              />
              <StatCard
                label="Today training"
                value={session ? session.title : "None"}
                detail={
                  session
                    ? `${session.workingSets} sets, ${session.volumeKg} kg${
                        trainingData.completionPercent == null
                          ? ""
                          : `, ${trainingData.completionPercent}% of plan`
                      }`
                    : trainingData.completionPercent == null
                      ? "No training logged today"
                      : `${trainingData.completionPercent}% of plan`
                }
              />
            </div>
          </div>
          <aside className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
            <h3 className="text-xl font-semibold text-emerald-100">Today&apos;s records</h3>
            <p className="mt-3 text-sm leading-6 text-emerald-50/80">
              Body metrics, food, and training on this page are read from the database.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-emerald-50/80">
              <li>Long-term goal: {activeGoal?.title ?? "None saved"}</li>
              <li>
                Logged foods: {foodEntries.length}{" "}
                {foodEntries.length === 1 ? "entry" : "entries"}
              </li>
              <li>Training sessions: {trainingData.sessions.length}</li>
              <li>
                7-entry weight average:{" "}
                {recentWeightAverageKg == null ? "—" : `${recentWeightAverageKg} kg`}
              </li>
              <li>Latest weight: {latestBodyMetric.weightKg ?? "—"} kg</li>
            </ul>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {(
            [
              ["Protein", consumed.proteinG, targets?.proteinG, "g"],
              ["Carbs", consumed.carbsG, targets?.carbsG, "g"],
              ["Fat", consumed.fatG, targets?.fatG, "g"],
              ["Calories", consumed.calories, targets?.calories, "kcal"],
            ] as const
          ).map(([label, value, target, unit]) => (
            <div key={label} className="rounded-3xl border border-white/10 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold">
                {value}
                <span className="text-base text-slate-400">
                  {" "}
                  / {target ?? "—"} {unit}
                </span>
              </p>
            </div>
          ))}
        </section>
      </AppShell>
    );
}
