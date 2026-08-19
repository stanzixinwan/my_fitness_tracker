import { AppShell } from "@/components/AppShell";
import { listPlanSuggestions } from "@/lib/llm/history";
import { GeneratePlanButton } from "@/app/planner/GeneratePlanButton";
import { getLlmStatus } from "@/lib/llm/config";

export default async function PlannerPage() {
  const suggestions = await listPlanSuggestions();
  const latest = suggestions[0];
  const llm = getLlmStatus();

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Planner
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Today meal plan</h2>
        <p className="mt-4 max-w-3xl text-slate-300">
          After you click the button, the API reads structured profile data, today&apos;s logs, and remaining nutrition targets, then generates and saves a JSON plan to
          {latest ? " suggestion history." : " suggestion history. No saved plans yet."}
        </p>
        <p className="mt-3 text-sm text-slate-400">
          LLM: {llm.provider === "local" ? "local fallback (set GEMINI_API_KEY or OPENAI_API_KEY to use a real model)" : `${llm.provider} / ${llm.model}`}
        </p>
        <GeneratePlanButton />
      </section>

      {latest ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="space-y-4">
            {latest.suggestion.meals.map((meal) => (
              <article
                key={`${latest.id}-${meal.mealType}-${meal.title}`}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-sky-300">
                  {meal.mealType}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{meal.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {meal.reason}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  {meal.foods.map((food) => (
                    <li key={food}>{food}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-slate-400">
                  {meal.calories} kcal · P{meal.proteinG} C{meal.carbsG} F{meal.fatG} ·
                  prep {meal.prepMinutes} min
                </p>
              </article>
            ))}
          </div>

          <aside className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6">
            <h3 className="text-xl font-semibold text-emerald-100">Plan summary</h3>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-200/70">
              {latest.model} · {latest.createdAt}
            </p>
            <p className="mt-3 text-sm leading-6 text-emerald-50/80">
              {latest.suggestion.summary}
            </p>
            <h4 className="mt-6 font-semibold text-emerald-100">Swaps</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-50/80">
              {latest.suggestion.swaps.map((swap) => (
                <li key={swap}>{swap}</li>
              ))}
            </ul>
            <h4 className="mt-6 font-semibold text-emerald-100">Cautions</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-50/80">
              {latest.suggestion.cautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </aside>
        </section>
      ) : (
        <section className="mt-8 rounded-[2rem] border border-dashed border-white/20 p-8 text-slate-400">
          No saved meal suggestions yet. Use the button above to generate your first plan.
        </section>
      )}
    </AppShell>
  );
}
