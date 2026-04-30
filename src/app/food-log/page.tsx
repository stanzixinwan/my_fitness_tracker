import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { foodEntries, getTodayNutritionSnapshot } from "@/lib/sample-data";

export default function FoodLogPage() {
  const { targets, consumed, remaining } = getTodayNutritionSnapshot();

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
            数据先由应用计算，LLM 不负责“记住”或重算核心指标。
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Calories" value={consumed.calories} detail={`Remaining ${remaining.calories}`} />
          <StatCard label="Protein" value={`${consumed.proteinG}g`} detail={`Target ${targets.proteinG}g`} />
          <StatCard label="Carbs / Fat" value={`${consumed.carbsG}g / ${consumed.fatG}g`} />
        </div>
      </section>

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
