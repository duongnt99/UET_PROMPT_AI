import { describe, expect, it } from "vitest";
import { hasPermission } from "@/server/domain/permissions";

describe("admin timer API authorization", () => {
  it("allows stage operators to read match timers", () => {
    expect(hasPermission(["ADMIN"], "stage:control")).toBe(true);
    expect(hasPermission(["TECH_OPERATOR"], "stage:control")).toBe(true);
  });

  it("denies participants from stage control permission", () => {
    expect(hasPermission(["PARTICIPANT"], "stage:control")).toBe(false);
  });

  it("denies unauthenticated-style empty roles", () => {
    expect(hasPermission([], "stage:control")).toBe(false);
  });
});
