import { getFitnessRepository } from "@/lib/data/repository-factory";
import type { PlanSuggestionRecord } from "@/lib/data/types";
import type { PlanSuggestion } from "@/lib/llm/schemas";

export type StoredPlanSuggestion = PlanSuggestionRecord;

export async function savePlanSuggestion(input: {
  model: string;
  inputSummary: Record<string, unknown>;
  suggestion: PlanSuggestion;
}): Promise<StoredPlanSuggestion> {
  const repository = getFitnessRepository();
  const date =
    typeof input.inputSummary.date === "string"
      ? input.inputSummary.date
      : new Date().toISOString().slice(0, 10);

  return repository.createPlanSuggestion({
    date,
    model: input.model,
    inputSummary: input.inputSummary,
    suggestion: input.suggestion,
  });
}

export async function listPlanSuggestions() {
  return getFitnessRepository().listPlanSuggestions(10);
}
