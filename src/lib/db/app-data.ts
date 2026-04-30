import { revalidatePath } from "next/cache";
import {
  foodEntryCreateSchema,
  profileUpdateSchema,
  type FoodEntryCreateInput,
  type ProfileUpdateInput,
} from "@/lib/api/schemas";
import {
  AppDataService,
  type FoodLogData,
  type ProfileData,
} from "@/lib/data/app-service";
import { getFitnessRepository } from "@/lib/data/repository-factory";
import { todayLog } from "@/lib/sample-data";

export type { FoodLogData, ProfileData };

function formDataToRecord(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getAppDataService() {
  return new AppDataService(getFitnessRepository());
}

export async function getProfileData(): Promise<ProfileData> {
  return getAppDataService().getProfileData();
}

export async function getFoodLogData(date = todayLog.date): Promise<FoodLogData> {
  return getAppDataService().getFoodLogData(date);
}

export async function updateProfile(input: ProfileUpdateInput) {
  return getAppDataService().updateProfile(input);
}

export async function updateProfileFromForm(formData: FormData) {
  const input = profileUpdateSchema.parse(formDataToRecord(formData));
  await updateProfile(input);

  revalidatePath("/");
  revalidatePath("/profile");
}

export async function createFoodEntry(input: FoodEntryCreateInput) {
  return getAppDataService().createFoodEntry(input);
}

export async function createFoodEntryFromForm(formData: FormData) {
  const input = foodEntryCreateSchema.parse(formDataToRecord(formData));
  await createFoodEntry(input);

  revalidatePath("/");
  revalidatePath("/food-log");
}
