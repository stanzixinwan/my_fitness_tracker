import type { PlannerContext } from "@/lib/llm/context";
import type { PlanSuggestion } from "@/lib/llm/schemas";

export type LlmProvider = {
  name: string;
  generatePlan(prompt: string, context: PlannerContext): Promise<unknown>;
};

export class LocalRuleProvider implements LlmProvider {
  name = "local-rule-provider";

  async generatePlan(_prompt: string, context: PlannerContext): Promise<PlanSuggestion> {
    const remaining = context.nutrition.remaining;
    const dinnerCalories = Math.round(remaining.calories * 0.75);
    const snackCalories = Math.max(0, remaining.calories - dinnerCalories);
    const dinnerProtein = Math.round(remaining.proteinG * 0.75);
    const snackProtein = Math.max(0, remaining.proteinG - dinnerProtein);
    const dinnerCarbs = Math.round(remaining.carbsG * 0.75);
    const snackCarbs = Math.max(0, remaining.carbsG - dinnerCarbs);
    const dinnerFat = Math.round(remaining.fatG * 0.75);
    const snackFat = Math.max(0, remaining.fatG - dinnerFat);

    return {
      summary:
        "基于今天已吃内容和晚间训练安排，优先补足蛋白质，并把主要碳水放在训练后晚餐。",
      meals: [
        {
          mealType: "dinner",
          title: "训练后高蛋白米饭碗",
          foods: ["瘦牛肉或鸡胸肉 180g", "熟米饭 220g", "西兰花 200g", "橄榄油 8g"],
          calories: dinnerCalories,
          proteinG: dinnerProtein,
          carbsG: dinnerCarbs,
          fatG: dinnerFat,
          prepMinutes: Math.min(context.dietPreference.maxCookingMinutes ?? 30, 30),
          reason: "晚餐承担剩余营养的大部分，训练后补碳水更利于恢复。",
        },
        {
          mealType: "snack",
          title: "睡前轻量蛋白加餐",
          foods: ["希腊酸奶 200g", "蓝莓 80g"],
          calories: snackCalories,
          proteinG: snackProtein,
          carbsG: snackCarbs,
          fatG: snackFat,
          prepMinutes: 5,
          reason: "用低准备成本补足蛋白质，避免晚间额外烹饪负担。",
        },
      ],
      swaps: ["米饭可以替换为土豆或全麦意面。", "鸡胸肉可以替换为虾仁、瘦牛肉或豆腐。"],
      cautions: ["这是基于示例数据的规划，不替代医生或注册营养师建议。"],
      total: {
        calories: remaining.calories,
        proteinG: remaining.proteinG,
        carbsG: remaining.carbsG,
        fatG: remaining.fatG,
      },
    };
  }
}

export class OpenAiCompatibleProvider implements LlmProvider {
  name = "openai-compatible-provider";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.openai.com/v1",
    private readonly model = "gpt-4o-mini",
  ) {}

  async generatePlan(prompt: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Return strict JSON only. Do not invent persistent user facts beyond the provided context.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("LLM response did not include content");
    }

    return JSON.parse(content);
  }
}

export function createPlannerProvider(): LlmProvider {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new LocalRuleProvider();
  }

  return new OpenAiCompatibleProvider(
    apiKey,
    process.env.OPENAI_BASE_URL,
    process.env.OPENAI_MODEL,
  );
}
