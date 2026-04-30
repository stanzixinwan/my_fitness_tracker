import { AppShell } from "@/components/AppShell";
import {
  activeGoal,
  dietPreference,
  latestBodyMetric,
  sampleProfile,
} from "@/lib/sample-data";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Profile
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            {sampleProfile.displayName}
          </h2>
          <dl className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Height</dt>
              <dd className="text-lg text-white">{sampleProfile.heightCm} cm</dd>
            </div>
            <div>
              <dt className="text-slate-500">Weight</dt>
              <dd className="text-lg text-white">{latestBodyMetric.weightKg} kg</dd>
            </div>
            <div>
              <dt className="text-slate-500">Activity</dt>
              <dd className="text-lg text-white">{sampleProfile.activityLevel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Body fat</dt>
              <dd className="text-lg text-white">
                {latestBodyMetric.bodyFatPercent}%
              </dd>
            </div>
          </dl>
          <p className="mt-6 rounded-2xl bg-slate-900 p-4 text-sm leading-6 text-slate-300">
            {sampleProfile.trainingExperience}
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Goals</p>
          <h2 className="mt-3 text-3xl font-semibold">{activeGoal.title}</h2>
          <p className="mt-4 text-slate-300">
            Target weight: {activeGoal.targetWeightKg} kg by {activeGoal.endDate}
          </p>
          <div className="mt-6 rounded-2xl bg-slate-900 p-4">
            <h3 className="font-semibold text-white">Diet preferences</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {dietPreference.dietStyle}。最多烹饪 {dietPreference.maxCookingMinutes} 分钟，
              每天约 {dietPreference.mealsPerDay} 餐。
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Preferred: {dietPreference.preferredFoods.join(", ")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Avoided: {dietPreference.avoidedFoods.join(", ")}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
