import type {
  CreatePlanSuggestionInput,
  FoodEntryRecord,
  PlanSuggestionRecord,
  ProfileBundle,
} from "@/lib/data/types";
import type {
  FoodEntryCreateInput,
  ProfileUpdateInput,
} from "@/lib/api/schemas";

export type FitnessRepository = {
  getProfileBundle(): Promise<ProfileBundle>;
  updateProfileBundle(input: ProfileUpdateInput): Promise<ProfileBundle>;
  listFoodEntries(date: string): Promise<FoodEntryRecord[]>;
  createFoodEntry(input: FoodEntryCreateInput): Promise<FoodEntryRecord>;
  listPlanSuggestions(limit?: number): Promise<PlanSuggestionRecord[]>;
  createPlanSuggestion(input: CreatePlanSuggestionInput): Promise<PlanSuggestionRecord>;
};
