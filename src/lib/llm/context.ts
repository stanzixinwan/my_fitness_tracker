import {
  foodEntries,
  plannedTraining,
  todayLog,
} from "@/lib/sample-data";
import { summarizeTraining } from "@/lib/domain/training";
import { getFoodLogData, getProfileData } from "@/lib/db/app-data";

export type PlannerContext = Awaited<ReturnType<typeof buildPlannerContext>>;

export async function buildPlannerContext() {
  const profileData = await getProfileData();
  const foodLogData = await getFoodLogData();

  return {
    profile: profileData.profile,
    bodyMetric: profileData.latestBodyMetric,
    goal: profileData.activeGoal,
    dietPreference: profileData.dietPreference,
    todayLog,
    foodEntries: foodLogData.foodEntries.length > 0 ? foodLogData.foodEntries : foodEntries,
    plannedTraining: summarizeTraining(plannedTraining),
    nutrition: {
      targets: foodLogData.targets,
      consumed: foodLogData.consumed,
      remaining: foodLogData.remaining,
    },
  };
}

export function buildPlannerPrompt(context: PlannerContext) {
  return [
    "You are a careful fitness and meal planning assistant. You must not rely on chat memory; use only the structured data below.",
    "Generate meal suggestions for the remaining meals today. Respect allergies, avoided foods, calorie targets, and macro targets.",
    "Output must be JSON only. Do not output markdown.",
    "",
    JSON.stringify(context, null, 2),
    "",
    "JSON shape:",
    JSON.stringify(
      {
        summary: "string",
        meals: [
          {
            mealType: "dinner",
            title: "string",
            foods: ["string"],
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            prepMinutes: 0,
            reason: "string",
          },
        ],
        swaps: ["string"],
        cautions: ["string"],
        total: {
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
        },
      },
      null,
      2,
    ),
  ].join("\n");
}
