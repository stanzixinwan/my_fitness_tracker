import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { getFoodLogData, getProfileData } from "@/lib/db/app-data";
import { completionPercent } from "@/lib/domain/nutrition";
import { summarizeTraining } from "@/lib/domain/training";
import { plannedTraining, todayLog } from "@/lib/sample-data";

export default async function Home() {
  const [profileData, foodLogData] = await Promise.all([
    getProfileData(),
    getFoodLogData(),
  ]);
  const { targets, consumed, remaining, foodEntries } = foodLogData;
  const { profile, activeGoal } = profileData;
  const training = summarizeTraining(plannedTraining);
  const proteinCompletion = completionPercent(consumed.proteinG, targets.proteinG);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Today
          </p>
          <h2 className="mt-3 text-4xl font-semibold">
            {profile.displayName}, tracking today with stable rules
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Goal: {activeGoal.title}. The app stores structured profile and logs; the LLM only uses these facts for daily suggestions.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Remaining calories"
              value={`${remaining.calories} kcal`}
              detail={`Target ${targets.calories} kcal, eaten ${consumed.calories} kcal`}
            />
            <StatCard
              label="Protein progress"
              value={`${proteinCompletion}%`}
              detail={`${consumed.proteinG}g / ${targets.proteinG}g`}
            />
            <StatCard
              label="Today training"
              value={todayLog.trainingStatus}
              detail={training.label}
            />
          </div>
        </div>
        <aside className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
          <h3 className="text-xl font-semibold text-emerald-100">Memory boundary</h3>
          <p className="mt-3 text-sm leading-6 text-emerald-50/80">
            Body data, goals, and preferences live in the database; prompts only read the facts needed. That reduces suggestion drift from conversational tone.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-emerald-50/80">
            <li>Long-term goal: {activeGoal.title}</li>
            <li>Today schedule: {todayLog.scheduleNote}</li>
            <li>Logged foods: {foodEntries.length} entries</li>
          </ul>
        </aside>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Protein", consumed.proteinG, targets.proteinG, "g"],
          ["Carbs", consumed.carbsG, targets.carbsG, "g"],
          ["Fat", consumed.fatG, targets.fatG, "g"],
          ["Calories", consumed.calories, targets.calories, "kcal"],
        ].map(([label, value, target, unit]) => (
          <div key={label} className="rounded-3xl border border-white/10 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {value}
              <span className="text-base text-slate-400">
                {" "}
                / {target} {unit}
              </span>
            </p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
