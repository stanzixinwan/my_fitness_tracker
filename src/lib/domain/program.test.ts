import { describe, expect, it } from "vitest";
import { generateProgram } from "@/lib/domain/program";

describe("program generation", () => {
  const program = generateProgram({
    startDate: "2026-11-02",
    daysPerWeek: 4,
    goalType: "muscle_gain",
  });

  it("builds five-week mesocycles and ends each one with a deload", () => {
    expect(program.mesocycles[0]?.weeks).toHaveLength(5);
    expect(program.mesocycles[0]?.weeks[4]?.deload).toBe(true);
    expect(program.mesocycles[0]?.weeks[0]?.sessions[0]?.exercises[0]?.sets).toBe(4);
    expect(program.mesocycles[0]?.weeks[4]?.sessions[0]?.exercises[0]?.sets).toBe(2);
    expect(program.mesocycles[0]?.weeks[4]?.sessions[0]?.exercises[0]?.intensityValue).toBe(6);
  });

  it("alternates upper and lower days for a four-day week", () => {
    const themes = program.mesocycles[0]?.weeks[0]?.sessions.map((session) => session.theme);

    expect(themes).toEqual(["Upper", "Lower", "Upper", "Lower"]);
  });
});
