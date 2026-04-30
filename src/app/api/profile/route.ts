import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatZodIssues, profileUpdateSchema } from "@/lib/api/schemas";
import { getProfileData, updateProfile } from "@/lib/db/app-data";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      data: await getProfileData(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown profile error";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const input = profileUpdateSchema.parse(await request.json());
    const data = await updateProfile(input);

    return NextResponse.json({
      status: "ok",
      data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid profile payload",
          issues: formatZodIssues(error),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown profile error";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
