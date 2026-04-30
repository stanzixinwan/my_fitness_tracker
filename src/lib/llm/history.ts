import { demoUserId, ensureDemoUser } from "@/lib/db/demo-user";
import { getPrisma } from "@/lib/db/prisma";
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

export async function savePlanSuggestion(input: {
  model: string;
  inputSummary: Record<string, unknown>;
  suggestion: PlanSuggestion;
}): Promise<StoredPlanSuggestion> {
  const prisma = getPrisma();
  const date =
    typeof input.inputSummary.date === "string"
      ? input.inputSummary.date
      : new Date().toISOString().slice(0, 10);

  if (prisma) {
    await ensureDemoUser(prisma);
    const inputSummaryJson = JSON.parse(JSON.stringify(input.inputSummary));
    const suggestionJson = JSON.parse(JSON.stringify(input.suggestion));
    const saved = await prisma.planSuggestion.create({
      data: {
        userId: demoUserId,
        date: new Date(date),
        model: input.model,
        inputSummary: inputSummaryJson,
        suggestion: suggestionJson,
        status: "DRAFT",
      },
    });

    return {
      id: saved.id,
      date: saved.date.toISOString().slice(0, 10),
      model: saved.model,
      inputSummary: saved.inputSummary as Record<string, unknown>,
      suggestion: saved.suggestion as PlanSuggestion,
      status: "draft",
      createdAt: saved.createdAt.toISOString(),
    };
  }

  const saved: StoredPlanSuggestion = {
    id: crypto.randomUUID(),
    date,
    model: input.model,
    inputSummary: input.inputSummary,
    suggestion: input.suggestion,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  planHistory.unshift(saved);
  return saved;
}

export async function listPlanSuggestions() {
  const prisma = getPrisma();

  if (prisma) {
    await ensureDemoUser(prisma);
    const rows = await prisma.planSuggestion.findMany({
      where: { userId: demoUserId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return rows.map((row) => ({
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      model: row.model,
      inputSummary: row.inputSummary as Record<string, unknown>,
      suggestion: row.suggestion as PlanSuggestion,
      status: row.status.toLowerCase() as StoredPlanSuggestion["status"],
      createdAt: row.createdAt.toISOString(),
    }));
  }

  return planHistory;
}
