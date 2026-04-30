import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { foodEntryCreateSchema, formatZodIssues } from "@/lib/api/schemas";
import { createFoodEntry, getFoodLogData } from "@/lib/db/app-data";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      data: await getFoodLogData(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown food log error";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = foodEntryCreateSchema.parse(await request.json());
    const data = await createFoodEntry(input);

    return NextResponse.json(
      {
        status: "ok",
        data,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid food entry payload",
          issues: formatZodIssues(error),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown food log error";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
