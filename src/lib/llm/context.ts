import {
  activeGoal,
  dietPreference,
  foodEntries,
  getTodayNutritionSnapshot,
  latestBodyMetric,
  plannedTraining,
  sampleProfile,
  todayLog,
} from "@/lib/sample-data";
import { summarizeTraining } from "@/lib/domain/training";

export type PlannerContext = ReturnType<typeof buildPlannerContext>;

export function buildPlannerContext() {
  const nutrition = getTodayNutritionSnapshot();

  return {
    profile: sampleProfile,
    bodyMetric: latestBodyMetric,
    goal: activeGoal,
    dietPreference,
    todayLog,
    foodEntries,
    plannedTraining: summarizeTraining(plannedTraining),
    nutrition,
  };
}

export function buildPlannerPrompt(context: PlannerContext) {
  return [
    "你是一个谨慎的健身饮食规划助手。你不能依赖聊天记忆，只能使用下面的结构化资料。",
    "请生成今天剩余餐次的饮食建议，必须遵守过敏、禁忌、目标热量和宏量营养素。",
    "输出必须是 JSON，不要输出 markdown。",
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
