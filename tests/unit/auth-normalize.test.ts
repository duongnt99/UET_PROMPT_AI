import { describe, expect, it } from "vitest";
import { normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";

describe("credential normalization", () => {
  it("trims email, lowercases, and strips invisible spaces", () => {
    expect(normalizeEmail("  Admin@PromptOff.local  ")).toBe("admin@promptoff.local");
    expect(normalizeEmail("\u00A0judge1@promptoff.local\u200B")).toBe("judge1@promptoff.local");
  });

  it("trims password edges without changing internal spaces", () => {
    expect(normalizePasswordInput("  DevPassword123!  ")).toBe("DevPassword123!");
    expect(normalizePasswordInput("pass word 12")).toBe("pass word 12");
    expect(normalizePasswordInput("\u00A0DevPassword123!\uFEFF")).toBe("DevPassword123!");
  });
});
