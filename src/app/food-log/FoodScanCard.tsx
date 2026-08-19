"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FoodScanResult } from "@/lib/llm/food-scan";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300";
const labelClass = "text-sm font-medium text-slate-300";

type ScanState = {
  model: string;
  result: FoodScanResult;
};

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function guessMealType() {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

async function fileToCompressedJpeg(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1280;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the photo for upload.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
        } else {
          reject(new Error("Could not compress the photo."));
        }
      },
      "image/jpeg",
      0.72,
    );
  });

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const [, data] = result.split(",", 2);
      if (!data) {
        reject(new Error("Could not read the photo."));
        return;
      }
      resolve(data);
    };
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(blob);
  });

  return { imageBase64: base64, mimeType: "image/jpeg" as const };
}

export function FoodScanCard() {
  const router = useRouter();
  const defaultDate = useMemo(() => todayDateString(), []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<{
    imageBase64: string;
    mimeType: "image/jpeg";
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanState | null>(null);
  const [mealType, setMealType] = useState(guessMealType);
  const [date, setDate] = useState(defaultDate);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setError(null);
    setScan(null);
    const payload = await fileToCompressedJpeg(file);
    setImagePayload(payload);
    setPreviewUrl(`data:image/jpeg;base64,${payload.imageBase64}`);
  }

  async function analyzePhoto() {
    if (!imagePayload) {
      setError("Take or choose a photo first.");
      return;
    }

    setIsScanning(true);
    setError(null);

    const response = await fetch("/api/food-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(imagePayload),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      data?: ScanState;
    } | null;

    if (!response.ok || !payload?.data) {
      setError(payload?.message ?? "Could not estimate nutrition from this photo.");
      setIsScanning(false);
      return;
    }

    setScan(payload.data);
    setIsScanning(false);
  }

  async function addToLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scan) {
      return;
    }

    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/food-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: String(form.get("date") ?? date),
        mealType: String(form.get("mealType") ?? mealType),
        foodName: String(form.get("foodName") ?? scan.result.foodName),
        quantity: Number(form.get("quantity") ?? scan.result.quantity),
        unit: String(form.get("unit") ?? scan.result.unit),
        calories: Number(form.get("calories") ?? scan.result.calories),
        proteinG: Number(form.get("proteinG") ?? scan.result.proteinG),
        carbsG: Number(form.get("carbsG") ?? scan.result.carbsG),
        fatG: Number(form.get("fatG") ?? scan.result.fatG),
        source: "photo-scan",
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    if (!response.ok) {
      setError(payload?.message ?? "Could not save this food entry.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-6">
      <h3 className="text-xl font-semibold text-sky-100">Scan a meal photo</h3>
      <p className="mt-2 text-sm leading-6 text-sky-50/80">
        Take a photo or upload one. A vision model estimates calories and macros; you can edit the numbers before saving.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950">
            {previewUrl ? (
              <div
                className="h-56 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${previewUrl})` }}
                role="img"
                aria-label="Selected meal"
              />
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                No photo selected
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-full bg-sky-200 px-5 py-2 text-sm font-semibold text-slate-950">
              Take or choose photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFileChange}
              />
            </label>
            <button
              type="button"
              onClick={analyzePhoto}
              disabled={isScanning || !imagePayload}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isScanning ? "Analyzing..." : "Estimate nutrition"}
            </button>
          </div>
        </div>

        {scan ? (
          <form onSubmit={addToLog} className="grid gap-3 sm:grid-cols-2">
            <p className="sm:col-span-2 text-xs uppercase tracking-[0.2em] text-sky-200/80">
              {scan.model} · confidence {scan.result.confidence}
            </p>
            <label className={labelClass}>
              Date
              <input name="date" type="date" defaultValue={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Meal
              <select name="mealType" defaultValue={mealType} onChange={(event) => setMealType(event.target.value)} className={inputClass}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Food
              <input name="foodName" defaultValue={scan.result.foodName} className={inputClass} required />
            </label>
            <label className={labelClass}>
              Quantity
              <input name="quantity" type="number" step="0.1" defaultValue={scan.result.quantity} className={inputClass} />
            </label>
            <label className={labelClass}>
              Unit
              <input name="unit" defaultValue={scan.result.unit} className={inputClass} />
            </label>
            <label className={labelClass}>
              Calories
              <input name="calories" type="number" step="1" defaultValue={Math.round(scan.result.calories)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Protein
              <input name="proteinG" type="number" step="0.1" defaultValue={scan.result.proteinG} className={inputClass} />
            </label>
            <label className={labelClass}>
              Carbs
              <input name="carbsG" type="number" step="0.1" defaultValue={scan.result.carbsG} className={inputClass} />
            </label>
            <label className={labelClass}>
              Fat
              <input name="fatG" type="number" step="0.1" defaultValue={scan.result.fatG} className={inputClass} />
            </label>
            {scan.result.items.length > 0 ? (
              <ul className="sm:col-span-2 space-y-1 text-sm text-sky-50/80">
                {scan.result.items.map((item) => (
                  <li key={`${item.name}-${item.portion}`}>
                    {item.name} ({item.portion}): {Math.round(item.calories)} kcal
                  </li>
                ))}
              </ul>
            ) : null}
            {scan.result.notes ? (
              <p className="sm:col-span-2 text-sm text-slate-300">{scan.result.notes}</p>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="sm:col-span-2 mt-1 rounded-full bg-emerald-300 px-6 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Add scanned food"}
            </button>
          </form>
        ) : (
          <p className="self-center text-sm leading-6 text-slate-300">
            Estimates are approximate. Review the numbers before adding them to your log.
          </p>
        )}
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
