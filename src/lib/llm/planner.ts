import { buildPlannerContext, buildPlannerPrompt } from "@/lib/llm/context";
import { createPlannerProvider } from "@/lib/llm/providers";
import { validatePlanSuggestion } from "@/lib/llm/schemas";

export async function generateTodayPlan() {
  const context = await buildPlannerContext();
  const prompt = buildPlannerPrompt(context);
  const provider = createPlannerProvider();
  const rawSuggestion = await provider.generatePlan(prompt, context);
  const suggestion = validatePlanSuggestion(rawSuggestion);

  return {
    model: provider.name,
    inputSummary: {
      date: context.todayLog.date,
      goal: context.goal.title,
      remaining: context.nutrition.remaining,
      scheduleNote: context.todayLog.scheduleNote,
    },
    suggestion,
  };
}
