import {
  calculateMacroTargets,
  calculateRemainingNutrition,
  sumNutrition,
} from "@/lib/domain/nutrition";
import type { FitnessRepository } from "@/lib/data/repository";
import type { FoodEntryRecord, ProfileBundle } from "@/lib/data/types";
import type {
  FoodEntryCreateInput,
  ProfileUpdateInput,
} from "@/lib/api/schemas";

export type ProfileData = ProfileBundle;

export type FoodLogData = {
  foodEntries: FoodEntryRecord[];
  targets: ReturnType<typeof calculateMacroTargets>;
  consumed: ReturnType<typeof sumNutrition>;
  remaining: ReturnType<typeof calculateRemainingNutrition>;
  isPersisted: boolean;
};

export class AppDataService {
  constructor(private readonly repository: FitnessRepository) {}

  getProfileData() {
    return this.repository.getProfileBundle();
  }

  async getFoodLogData(date: string) {
    const profileData = await this.repository.getProfileBundle();
    const foodEntries = await this.repository.listFoodEntries(date);
    const biometrics = {
      ...profileData.profile,
      weightKg: profileData.latestBodyMetric.weightKg,
    };
    const targets = calculateMacroTargets(biometrics, profileData.activeGoal);
    const consumed = sumNutrition(foodEntries);

    return {
      foodEntries,
      targets,
      consumed,
      remaining: calculateRemainingNutrition(targets, consumed),
      isPersisted: profileData.isPersisted,
    };
  }

  updateProfile(input: ProfileUpdateInput) {
    return this.repository.updateProfileBundle(input);
  }

  async createFoodEntry(input: FoodEntryCreateInput) {
    await this.repository.createFoodEntry(input);
    return this.getFoodLogData(input.date);
  }
}
