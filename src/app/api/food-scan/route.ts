import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodIssues } from "@/lib/api/schemas";
import { analyzeFoodPhoto } from "@/lib/llm/analyze-food";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const scan = await analyzeFoodPhoto(await request.json());

    return NextResponse.json({
      status: "ok",
      data: scan,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid food scan payload",
          issues: formatZodIssues(error),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown food scan error";
    const status = message.includes("GEMINI_API_KEY") || message.includes("OPENAI_API_KEY")
      ? 503
      : 500;

    return NextResponse.json({ status: "error", message }, { status });
  }
}
