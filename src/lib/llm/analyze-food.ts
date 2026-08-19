import { completeJson } from "@/lib/llm/client";
import { requireVisionLlm } from "@/lib/llm/config";
import {
  decodeImageBase64,
  foodScanRequestSchema,
  validateFoodScanResult,
  type FoodScanResult,
} from "@/lib/llm/food-scan";

const foodScanPrompt = [
  "Identify the food in this photo and estimate nutrition for the visible portion.",
  "If multiple items are visible, estimate each item and also return a combined total.",
  "Use common USDA-style estimates. Do not invent a barcode or brand unless clearly visible.",
  "If the photo is unclear, still return a best estimate and set confidence to low.",
  "Return JSON only with this shape:",
  JSON.stringify(
    {
      foodName: "string",
      quantity: 1,
      unit: "serving",
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      confidence: "low",
      items: [
        {
          name: "string",
          portion: "string",
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
        },
      ],
      notes: "string",
    },
    null,
    2,
  ),
].join("\n");

export async function analyzeFoodPhoto(rawInput: unknown): Promise<{
  model: string;
  result: FoodScanResult;
}> {
  const status = requireVisionLlm();
  const input = foodScanRequestSchema.parse(rawInput);
  const imageBase64 = decodeImageBase64(input.imageBase64);
  const rawResult = await completeJson({
    system:
      "You are a nutrition estimator. Return strict JSON only. Estimates are approximate and not medical advice.",
    prompt: foodScanPrompt,
    images: [{ mimeType: input.mimeType, base64: imageBase64 }],
  });

  return {
    model: `${status.provider}:${status.model}`,
    result: validateFoodScanResult(rawResult),
  };
}
