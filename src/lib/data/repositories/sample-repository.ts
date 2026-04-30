import type { FoodEntryCreateInput, ProfileUpdateInput } from "@/lib/api/schemas";
import type { FitnessRepository } from "@/lib/data/repository";
import type {
  CreatePlanSuggestionInput,
  FoodEntryRecord,
  PlanSuggestionRecord,
  ProfileBundle,
} from "@/lib/data/types";
import {
  activeGoal,
  dietPreference,
  foodEntries,
  latestBodyMetric,
  sampleProfile,
  todayLog,
} from "@/lib/sample-data";

const profileBundle: ProfileBundle = {
  profile: { ...sampleProfile },
  latestBodyMetric: { ...latestBodyMetric },
  activeGoal: { ...activeGoal },
  dietPreference: { ...dietPreference },
  isPersisted: false,
};

const localFoodEntries: FoodEntryRecord[] = foodEntries.map((entry) => ({ ...entry }));
const localPlanSuggestions: PlanSuggestionRecord[] = [];

export class SampleRepository implements FitnessRepository {
  async getProfileBundle(): Promise<ProfileBundle> {
    return {
      profile: { ...profileBundle.profile },
      latestBodyMetric: { ...profileBundle.latestBodyMetric },
      activeGoal: { ...profileBundle.activeGoal },
      dietPreference: {
        ...profileBundle.dietPreference,
        allergies: [...profileBundle.dietPreference.allergies],
        avoidedFoods: [...profileBundle.dietPreference.avoidedFoods],
        preferredFoods: [...profileBundle.dietPreference.preferredFoods],
        dislikedFoods: [...profileBundle.dietPreference.dislikedFoods],
      },
      isPersisted: false,
    };
  }

  async updateProfileBundle(input: ProfileUpdateInput): Promise<ProfileBundle> {
    profileBundle.profile = {
      ...profileBundle.profile,
      displayName: input.displayName,
      birthYear: input.birthYear,
      sex: input.sex,
      heightCm: input.heightCm,
      activityLevel: input.activityLevel,
      trainingExperience: input.trainingExperience,
      defaultWakeTime: input.defaultWakeTime,
      defaultSleepTime: input.defaultSleepTime,
    };
    profileBundle.latestBodyMetric = {
      date: input.metricDate,
      weightKg: input.weightKg,
      bodyFatPercent: input.bodyFatPercent,
      waistCm: input.waistCm,
    };
    profileBundle.dietPreference = {
      dietStyle: input.dietStyle,
      allergies: input.allergies,
      avoidedFoods: input.avoidedFoods,
      preferredFoods: input.preferredFoods,
      dislikedFoods: input.dislikedFoods,
      budgetLevel: input.budgetLevel,
      maxCookingMinutes: input.maxCookingMinutes,
      mealsPerDay: input.mealsPerDay,
      notes: input.notes,
    };

    return this.getProfileBundle();
  }

  async listFoodEntries(date: string): Promise<FoodEntryRecord[]> {
    const fallbackDate = todayLog.date;

    return localFoodEntries
      .filter((entry) => date === fallbackDate || entry.id.startsWith(`${date}-`))
      .map((entry) => ({ ...entry }));
  }

  async createFoodEntry(input: FoodEntryCreateInput): Promise<FoodEntryRecord> {
    const entry: FoodEntryRecord = {
      id: `${input.date}-${crypto.randomUUID()}`,
      mealType: input.mealType,
      foodName: input.foodName,
      quantity: input.quantity,
      unit: input.unit,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
    };

    localFoodEntries.push(entry);
    return { ...entry };
  }

  async listPlanSuggestions(limit = 10): Promise<PlanSuggestionRecord[]> {
    return localPlanSuggestions.slice(0, limit).map((suggestion) => ({
      ...suggestion,
      inputSummary: { ...suggestion.inputSummary },
      suggestion: { ...suggestion.suggestion },
    }));
  }

  async createPlanSuggestion(
    input: CreatePlanSuggestionInput,
  ): Promise<PlanSuggestionRecord> {
    const suggestion: PlanSuggestionRecord = {
      id: crypto.randomUUID(),
      date: input.date,
      model: input.model,
      inputSummary: input.inputSummary,
      suggestion: input.suggestion,
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    localPlanSuggestions.unshift(suggestion);
    return { ...suggestion };
  }
}
