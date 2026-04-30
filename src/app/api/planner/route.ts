import { NextResponse } from "next/server";
import { listPlanSuggestions, savePlanSuggestion } from "@/lib/llm/history";
import { generateTodayPlan } from "@/lib/llm/planner";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    suggestions: await listPlanSuggestions(),
  });
}

export async function POST() {
  try {
    const plan = await generateTodayPlan();
    const savedSuggestion = await savePlanSuggestion(plan);

    return NextResponse.json({
      status: "ok",
      saved: true,
      savedSuggestion,
      plan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown planner error";

    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: 500 },
    );
  }
}
