import type {
  ApiResponse,
  FoodEntryCreateInput,
  ProfileUpdateInput,
} from "@/lib/api/schemas";
import type { FoodLogData, ProfileData } from "@/lib/db/app-data";
import type { StoredPlanSuggestion } from "@/lib/llm/history";

export type GetProfileResponse = ApiResponse<ProfileData>;
export type UpdateProfileRequest = ProfileUpdateInput;
export type UpdateProfileResponse = ApiResponse<ProfileData>;

export type GetFoodLogResponse = ApiResponse<FoodLogData>;
export type CreateFoodEntryRequest = FoodEntryCreateInput;
export type CreateFoodEntryResponse = ApiResponse<FoodLogData>;

export type GetPlannerResponse = ApiResponse<{
  suggestions: StoredPlanSuggestion[];
}>;

export type CreatePlannerResponse = ApiResponse<{
  saved: true;
  savedSuggestion: StoredPlanSuggestion;
  plan: {
    model: string;
    inputSummary: Record<string, unknown>;
    suggestion: StoredPlanSuggestion["suggestion"];
  };
}>;
