import { AppShell } from "@/components/AppShell";
import { getProfileData, updateProfileFromForm } from "@/lib/db/app-data";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300";
const labelClass = "text-sm font-medium text-slate-300";

async function saveProfileAction(formData: FormData) {
  "use server";

  await updateProfileFromForm(formData);
}

export default async function ProfilePage() {
  const { profile, latestBodyMetric, activeGoal, dietPreference, isPersisted } =
    await getProfileData();

  return (
    <AppShell>
      <form action={saveProfileAction} className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Profile
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Body metrics</h2>
          <p className="mt-3 text-sm text-slate-400">
            {isPersisted ? "Database connected; submissions are saved via Prisma." : "Database not configured; forms work for preview but will not persist."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Display name
              <input name="displayName" defaultValue={profile.displayName} className={inputClass} />
            </label>
            <label className={labelClass}>
              Birth year
              <input name="birthYear" type="number" defaultValue={profile.birthYear} className={inputClass} />
            </label>
            <label className={labelClass}>
              Sex
              <select name="sex" defaultValue={profile.sex} className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unspecified">Unspecified</option>
              </select>
            </label>
            <label className={labelClass}>
              Activity
              <select name="activityLevel" defaultValue={profile.activityLevel} className={inputClass}>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very active</option>
              </select>
            </label>
            <label className={labelClass}>
              Height cm
              <input name="heightCm" type="number" step="0.1" defaultValue={profile.heightCm} className={inputClass} />
            </label>
            <label className={labelClass}>
              Weight kg
              <input name="weightKg" type="number" step="0.1" defaultValue={latestBodyMetric.weightKg} className={inputClass} />
            </label>
            <label className={labelClass}>
              Body fat %
              <input name="bodyFatPercent" type="number" step="0.1" defaultValue={latestBodyMetric.bodyFatPercent} className={inputClass} />
            </label>
            <label className={labelClass}>
              Waist cm
              <input name="waistCm" type="number" step="0.1" defaultValue={latestBodyMetric.waistCm} className={inputClass} />
            </label>
            <label className={labelClass}>
              Metric date
              <input name="metricDate" type="date" defaultValue={latestBodyMetric.date} className={inputClass} />
            </label>
            <label className={labelClass}>
              Wake time
              <input name="defaultWakeTime" type="time" defaultValue={profile.defaultWakeTime} className={inputClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Training experience
              <textarea
                name="trainingExperience"
                defaultValue={profile.trainingExperience}
                className={`${inputClass} min-h-28`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Goals</p>
          <h2 className="mt-3 text-3xl font-semibold">{activeGoal.title}</h2>
          <p className="mt-4 text-slate-300">
            Target weight {activeGoal.targetWeightKg} kg by {activeGoal.endDate}
          </p>

          <div className="mt-6 grid gap-4">
            <label className={labelClass}>
              Diet style
              <input name="dietStyle" defaultValue={dietPreference.dietStyle} className={inputClass} />
            </label>
            <label className={labelClass}>
              Preferred foods
              <input name="preferredFoods" defaultValue={dietPreference.preferredFoods.join(", ")} className={inputClass} />
            </label>
            <label className={labelClass}>
              Avoided foods
              <input name="avoidedFoods" defaultValue={dietPreference.avoidedFoods.join(", ")} className={inputClass} />
            </label>
            <label className={labelClass}>
              Allergies
              <input name="allergies" defaultValue={dietPreference.allergies.join(", ")} className={inputClass} />
            </label>
            <label className={labelClass}>
              Disliked foods
              <input name="dislikedFoods" defaultValue={dietPreference.dislikedFoods.join(", ")} className={inputClass} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                Budget
                <input name="budgetLevel" defaultValue={dietPreference.budgetLevel} className={inputClass} />
              </label>
              <label className={labelClass}>
                Cook min
                <input name="maxCookingMinutes" type="number" defaultValue={dietPreference.maxCookingMinutes} className={inputClass} />
              </label>
              <label className={labelClass}>
                Meals/day
                <input name="mealsPerDay" type="number" defaultValue={dietPreference.mealsPerDay} className={inputClass} />
              </label>
            </div>
            <label className={labelClass}>
              Notes
              <textarea name="notes" defaultValue={dietPreference.notes} className={`${inputClass} min-h-24`} />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-full bg-emerald-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
          >
            Save profile
          </button>
        </section>
      </form>
    </AppShell>
  );
}
