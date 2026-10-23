import { AppShell } from "@/components/AppShell";
import { DataError } from "@/components/DataError";
import { generateProgramFromForm, getTodayPlan } from "@/lib/db/program-store";
import { loadRecords } from "@/lib/db/load-records";
import { localDateString } from "@/lib/dates";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300";
const labelClass = "text-sm font-medium text-slate-300";

async function generateProgramAction(formData: FormData) {
  "use server";

  await generateProgramFromForm(formData);
}

export default async function ProgramPage() {
  const result = await loadRecords(() => getTodayPlan());

  if (!result.ok) {
    return <DataError message={result.message} />;
  }

  const today = localDateString();

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Program</p>
        <h2 className="mt-3 text-3xl font-semibold">Today&apos;s session</h2>
        {result.data.text ? (
          <pre className="mt-6 whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-100">
            {result.data.text}
          </pre>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No planned session for {result.data.date}.</p>
        )}
      </section>

      <form
        action={generateProgramAction}
        className="mt-8 rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6"
      >
        <h3 className="text-xl font-semibold text-emerald-100">Generate a year</h3>
        <p className="mt-2 text-sm text-emerald-50/80">
          Builds year, mesocycle, and week plans from the active goal. Each mesocycle ends with a deload week.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Start date
            <input name="startDate" type="date" defaultValue={today} className={inputClass} required />
          </label>
          <label className={labelClass}>
            Days per week
            <input name="daysPerWeek" type="number" min="3" max="6" defaultValue="4" className={inputClass} required />
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 rounded-full bg-emerald-300 px-6 py-3 font-semibold text-slate-950"
        >
          Generate plan
        </button>
      </form>
    </AppShell>
  );
}
