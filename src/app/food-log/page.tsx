import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { createFoodEntryFromForm, getFoodLogData } from "@/lib/db/app-data";
import { todayLog } from "@/lib/sample-data";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300";
const labelClass = "text-sm font-medium text-slate-300";

async function createFoodEntryAction(formData: FormData) {
  "use server";

  await createFoodEntryFromForm(formData);
}

export default async function FoodLogPage() {
  const { foodEntries, targets, consumed, remaining, isPersisted } =
    await getFoodLogData();

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Food Log
            </p>
            <h2 className="mt-3 text-3xl font-semibold">今日营养追踪</h2>
          </div>
          <p className="text-sm text-slate-400">
            {isPersisted ? "新增记录会写入数据库。" : "当前未配置数据库，新增记录不会持久保存。"}
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Calories" value={consumed.calories} detail={`Remaining ${remaining.calories}`} />
          <StatCard label="Protein" value={`${consumed.proteinG}g`} detail={`Target ${targets.proteinG}g`} />
          <StatCard label="Carbs / Fat" value={`${consumed.carbsG}g / ${consumed.fatG}g`} />
        </div>
      </section>

      <form
        action={createFoodEntryAction}
        className="mt-8 rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6"
      >
        <h3 className="text-xl font-semibold text-emerald-100">Add food entry</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className={labelClass}>
            Date
            <input name="date" type="date" defaultValue={todayLog.date} className={inputClass} />
          </label>
          <label className={labelClass}>
            Meal
            <select name="mealType" defaultValue="snack" className={inputClass}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Food
            <input name="foodName" placeholder="Greek yogurt 200g" className={inputClass} required />
          </label>
          <label className={labelClass}>
            Quantity
            <input name="quantity" type="number" step="0.1" defaultValue="1" className={inputClass} />
          </label>
          <label className={labelClass}>
            Unit
            <input name="unit" defaultValue="serving" className={inputClass} />
          </label>
          <label className={labelClass}>
            Calories
            <input name="calories" type="number" step="1" defaultValue="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            Protein
            <input name="proteinG" type="number" step="0.1" defaultValue="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            Carbs
            <input name="carbsG" type="number" step="0.1" defaultValue="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            Fat
            <input name="fatG" type="number" step="0.1" defaultValue="0" className={inputClass} />
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 rounded-full bg-emerald-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200"
        >
          Add entry
        </button>
      </form>

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10">
        <div className="grid grid-cols-5 bg-white/[0.06] px-5 py-3 text-sm text-slate-400">
          <span>Meal</span>
          <span className="col-span-2">Food</span>
          <span>Calories</span>
          <span>Macros</span>
        </div>
        {foodEntries.map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-5 border-t border-white/10 px-5 py-4 text-sm"
          >
            <span className="capitalize text-emerald-200">{entry.mealType}</span>
            <span className="col-span-2 text-white">{entry.foodName}</span>
            <span>{entry.calories} kcal</span>
            <span className="text-slate-300">
              P{entry.proteinG} C{entry.carbsG} F{entry.fatG}
            </span>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
