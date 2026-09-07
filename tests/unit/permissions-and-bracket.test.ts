import { describe, expect, it } from "vitest";
import { canChangeRole, hasPermission, homePathForRoles, resolvePostLoginPath } from "@/server/domain/permissions";
import { canTransition, REGISTRATION_TRANSITIONS } from "@/server/domain/status-transitions";
import { buildWinnerAdvancement, detectBracketCycle } from "@/server/domain/bracket";

describe("permission checks", () => {
  it("allows SUPER_ADMIN every permission", () => {
    expect(hasPermission(["SUPER_ADMIN"], "score:reopen")).toBe(true);
  });

  it("prevents ADMIN from changing SUPER_ADMIN", () => {
    expect(
      canChangeRole({
        actorRoles: ["ADMIN"],
        targetCurrentRoles: ["SUPER_ADMIN"],
        nextRole: "ADMIN",
      }).ok,
    ).toBe(false);
  });

  it("blocks TECH_OPERATOR from exporting PII", () => {
    expect(hasPermission(["TECH_OPERATOR"], "export:pii")).toBe(false);
    expect(hasPermission(["TECH_OPERATOR"], "operations:control")).toBe(true);
    expect(hasPermission(["TECH_OPERATOR"], "email:manage")).toBe(false);
    expect(hasPermission(["PARTICIPANT"], "email:manage")).toBe(false);
    expect(hasPermission(["ADMIN"], "email:manage")).toBe(true);
  });
});

describe("post-login home", () => {
  it("sends staff to their workspace instead of participant dashboard", () => {
    expect(homePathForRoles(["ADMIN"])).toBe("/admin");
    expect(homePathForRoles(["JUDGE"])).toBe("/judge");
    expect(homePathForRoles(["REVIEWER"])).toBe("/reviewer");
    expect(homePathForRoles(["PARTICIPANT"])).toBe("/dashboard");
    expect(resolvePostLoginPath("/dashboard", ["ADMIN"])).toBe("/admin");
    expect(resolvePostLoginPath("/dashboard/dang-ky", ["JUDGE"])).toBe("/judge");
    expect(resolvePostLoginPath("/dashboard/doi-thi", ["REVIEWER"])).toBe("/reviewer");
    expect(resolvePostLoginPath("/judge/matches/abc", ["JUDGE"])).toBe("/judge/matches/abc");
    expect(resolvePostLoginPath("/admin", ["PARTICIPANT"])).toBe("/dashboard");
  });
});

describe("status transitions", () => {
  it("allows draft to submitted and rejects locked to submitted", () => {
    expect(canTransition(REGISTRATION_TRANSITIONS, "DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransition(REGISTRATION_TRANSITIONS, "LOCKED", "SUBMITTED")).toBe(false);
  });
});

describe("winner advancement", () => {
  it("detects cycles in a custom match graph", () => {
    const cycle = detectBracketCycle([
      { id: "m1", nextMatchId: "m2" },
      { id: "m2", nextMatchId: "m1" },
    ]);
    expect(cycle).not.toBeNull();
  });

  it("advances a winner into the configured next slot", () => {
    expect(
      buildWinnerAdvancement({
        winnerId: "f1",
        nextMatchId: "final",
        nextSlot: "A",
      }),
    ).toEqual({ winnerId: "f1", nextMatchId: "final", nextSlot: "A" });
  });
});
