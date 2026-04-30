import type { PlanSuggestion } from "@/lib/llm/schemas";

export type StoredPlanSuggestion = {
  id: string;
  date: string;
  model: string;
  inputSummary: Record<string, unknown>;
  suggestion: PlanSuggestion;
  status: "draft" | "accepted" | "rejected" | "completed";
  createdAt: string;
};

const planHistory: StoredPlanSuggestion[] = [];

export function savePlanSuggestion(input: {
  model: string;
  inputSummary: Record<string, unknown>;
  suggestion: PlanSuggestion;
}): StoredPlanSuggestion {
  const saved: StoredPlanSuggestion = {
    id: crypto.randomUUID(),
    date:
      typeof input.inputSummary.date === "string"
        ? input.inputSummary.date
        : new Date().toISOString().slice(0, 10),
    model: input.model,
    inputSummary: input.inputSummary,
    suggestion: input.suggestion,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  planHistory.unshift(saved);
  return saved;
}

export function listPlanSuggestions() {
  return planHistory;
}
