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
        "Based on today's intake and evening training, prioritize protein and place most carbs in the post-workout dinner.",
      meals: [
        {
          mealType: "dinner",
          title: "Post-workout high-protein rice bowl",
          foods: ["Lean beef or chicken breast 180g", "Cooked rice 220g", "Broccoli 200g", "Olive oil 8g"],
          calories: dinnerCalories,
          proteinG: dinnerProtein,
          carbsG: dinnerCarbs,
          fatG: dinnerFat,
          prepMinutes: Math.min(context.dietPreference.maxCookingMinutes ?? 30, 30),
          reason: "Dinner covers most of the remaining nutrition; post-workout carbs support recovery.",
        },
        {
          mealType: "snack",
          title: "Light bedtime protein snack",
          foods: ["Greek yogurt 200g", "Blueberries 80g"],
          calories: snackCalories,
          proteinG: snackProtein,
          carbsG: snackCarbs,
          fatG: snackFat,
          prepMinutes: 5,
          reason: "Low-prep way to top up protein without extra evening cooking.",
        },
      ],
      swaps: ["Rice can be swapped for potatoes or whole-wheat pasta.", "Chicken breast can be swapped for shrimp, lean beef, or tofu."],
      cautions: ["This plan is based on sample data and does not replace advice from a doctor or registered dietitian."],
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
