import { describe, expect, it } from "vitest";
import {
  canEditTeamRoster,
  canSubmitRegistrationStatus,
} from "@/server/domain/registration-rules";
import {
  canAddTeamMember,
  countAcceptedTeamMembers,
  validateTeamSize,
} from "@/server/domain/team-rules";

describe("team roster editability", () => {
  it("allows roster edits only in draft or needs-update", () => {
    expect(canEditTeamRoster({ status: "DRAFT", allowEditAfterSubmit: false }).ok).toBe(true);
    expect(canEditTeamRoster({ status: "NEEDS_UPDATE", allowEditAfterSubmit: false }).ok).toBe(true);
    expect(canEditTeamRoster({ status: "SUBMITTED", allowEditAfterSubmit: false }).ok).toBe(false);
  });

  it("blocks repeat submit after submitted", () => {
    expect(canSubmitRegistrationStatus("DRAFT").ok).toBe(true);
    expect(canSubmitRegistrationStatus("SUBMITTED").ok).toBe(false);
  });
});

describe("team size rules", () => {
  it("counts accepted members including captain", () => {
    expect(
      countAcceptedTeamMembers([
        { status: "ACCEPTED" },
        { status: "PENDING" },
        { status: "ACCEPTED" },
      ]),
    ).toBe(2);
  });

  it("rejects submit below minimum", () => {
    expect(validateTeamSize({ acceptedMemberCount: 1, minSize: 2, maxSize: 3 }).ok).toBe(false);
  });

  it("accepts valid team size", () => {
    expect(validateTeamSize({ acceptedMemberCount: 2, minSize: 2, maxSize: 3 }).ok).toBe(true);
    expect(validateTeamSize({ acceptedMemberCount: 3, minSize: 2, maxSize: 3 }).ok).toBe(true);
  });

  it("rejects over maximum", () => {
    expect(validateTeamSize({ acceptedMemberCount: 4, minSize: 2, maxSize: 3 }).ok).toBe(false);
  });

  it("blocks invite when accepted plus pending reaches max", () => {
    expect(
      canAddTeamMember({
        acceptedMemberCount: 2,
        pendingInvitationCount: 1,
        settings: { minSize: 2, maxSize: 3 },
      }).ok,
    ).toBe(false);
  });

  it("allows invite when capacity remains", () => {
    expect(
      canAddTeamMember({
        acceptedMemberCount: 2,
        pendingInvitationCount: 0,
        settings: { minSize: 2, maxSize: 3 },
      }).ok,
    ).toBe(true);
  });
});
