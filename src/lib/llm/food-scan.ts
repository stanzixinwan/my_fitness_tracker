import { z } from "zod";

const nonNegativeNumber = z.coerce.number().nonnegative();

export const foodScanItemSchema = z.object({
  name: z.string().min(1),
  portion: z.string().min(1),
  calories: nonNegativeNumber,
  proteinG: nonNegativeNumber,
  carbsG: nonNegativeNumber,
  fatG: nonNegativeNumber,
});

export const foodScanResultSchema = z.object({
  foodName: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  calories: nonNegativeNumber,
  proteinG: nonNegativeNumber,
  carbsG: nonNegativeNumber,
  fatG: nonNegativeNumber,
  confidence: z.enum(["low", "medium", "high"]),
  items: z.array(foodScanItemSchema).default([]),
  notes: z.string().default(""),
});

export const foodScanRequestSchema = z.object({
  imageBase64: z.string().min(32),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export type FoodScanResult = z.infer<typeof foodScanResultSchema>;
export type FoodScanRequest = z.infer<typeof foodScanRequestSchema>;

export function validateFoodScanResult(value: unknown) {
  return foodScanResultSchema.parse(value);
}

const MAX_IMAGE_BYTES = 3_500_000;

export function decodeImageBase64(imageBase64: string) {
  const cleaned = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((cleaned.length * 3) / 4) - padding;

  if (bytes <= 0 || bytes > MAX_IMAGE_BYTES) {
    throw new Error("Image must be a JPEG, PNG, or WebP under 3.5MB.");
  }

  return cleaned;
}
