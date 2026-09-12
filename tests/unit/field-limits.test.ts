import { describe, expect, it } from "vitest";
import {
  FIELD_LIMITS,
  normalizeAuditReason,
  normalizeChallengeNotes,
  normalizeProfileData,
} from "@/config/field-limits";

describe("field limits", () => {
  it("accepts audit reason within limit", () => {
    expect(normalizeAuditReason("abc")).toBe("abc");
    expect(normalizeAuditReason("x".repeat(FIELD_LIMITS.AUDIT_REASON))).toHaveLength(
      FIELD_LIMITS.AUDIT_REASON,
    );
  });

  it("rejects audit reason over limit", () => {
    expect(() => normalizeAuditReason("x".repeat(FIELD_LIMITS.AUDIT_REASON + 1))).toThrow(
      /tối đa/,
    );
  });

  it("rejects challenge notes over limit", () => {
    expect(() => normalizeChallengeNotes("x".repeat(FIELD_LIMITS.CHALLENGE_NOTES + 1))).toThrow(
      /tối đa/,
    );
  });

  it("accepts profile data within limits", () => {
    expect(
      normalizeProfileData({
        fullName: "Nguyễn Văn A",
        institution: "UET",
      }).fullName,
    ).toBe("Nguyễn Văn A");
  });

  it("rejects profile full name over limit", () => {
    expect(() =>
      normalizeProfileData({
        fullName: "x".repeat(FIELD_LIMITS.PROFILE_FULL_NAME + 1),
      }),
    ).toThrow(/Họ và tên tối đa/);
  });

  it("rejects empty profile full name", () => {
    expect(() => normalizeProfileData({ fullName: "  " })).toThrow(/không được để trống/);
  });
});
