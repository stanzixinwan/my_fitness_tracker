import type {
  ApiResponse,
  FoodEntryCreateInput,
  ProfileUpdateInput,
} from "@/lib/api/schemas";
import type { FoodLogData, ProfileData } from "@/lib/db/app-data";

export type GetProfileResponse = ApiResponse<ProfileData>;
export type UpdateProfileRequest = ProfileUpdateInput;
export type UpdateProfileResponse = ApiResponse<ProfileData>;

export type GetFoodLogResponse = ApiResponse<FoodLogData>;
export type CreateFoodEntryRequest = FoodEntryCreateInput;
export type CreateFoodEntryResponse = ApiResponse<FoodLogData>;
