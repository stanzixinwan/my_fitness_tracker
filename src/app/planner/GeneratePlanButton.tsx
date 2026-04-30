"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GeneratePlanButton() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePlan() {
    setIsGenerating(true);
    setError(null);

    const response = await fetch("/api/planner", {
      method: "POST",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(payload?.message ?? "Failed to generate plan");
      setIsGenerating(false);
      return;
    }

    router.refresh();
    setIsGenerating(false);
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={generatePlan}
        disabled={isGenerating}
        className="rounded-full bg-emerald-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? "Generating..." : "Generate and save today's plan"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
