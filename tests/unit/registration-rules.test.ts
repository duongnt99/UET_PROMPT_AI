import { describe, expect, it } from "vitest";
import {
  assertSingleActiveRegistration,
  canSubmitRegistration,
  isRegistrationTypeAllowed,
} from "@/server/domain/registration-rules";
import { validateTeamSize } from "@/server/domain/team-rules";

describe("registration mode rules", () => {
  it("blocks submit when mode is UNDECIDED", () => {
    const result = canSubmitRegistration("UNDECIDED");
    expect(result.ok).toBe(false);
  });

  it("allows individual and team when mode is BOTH", () => {
    expect(isRegistrationTypeAllowed("BOTH", "INDIVIDUAL")).toBe(true);
    expect(isRegistrationTypeAllowed("BOTH", "TEAM")).toBe(true);
  });

  it("rejects team registration when mode is INDIVIDUAL", () => {
    expect(isRegistrationTypeAllowed("INDIVIDUAL", "TEAM")).toBe(false);
  });
});

describe("single active registration", () => {
  it("prevents a person from belonging to two active registrations", () => {
    expect(assertSingleActiveRegistration({ existingActiveCount: 1 }).ok).toBe(false);
    expect(assertSingleActiveRegistration({ existingActiveCount: 0 }).ok).toBe(true);
  });
});

describe("team size validation", () => {
  it("enforces configured min and max size", () => {
    expect(validateTeamSize({ acceptedMemberCount: 1, minSize: 2, maxSize: 4 }).ok).toBe(false);
    expect(validateTeamSize({ acceptedMemberCount: 3, minSize: 2, maxSize: 4 }).ok).toBe(true);
    expect(validateTeamSize({ acceptedMemberCount: 5, minSize: 2, maxSize: 4 }).ok).toBe(false);
  });
});
