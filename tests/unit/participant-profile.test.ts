import { describe, expect, it } from "vitest";
import {
  isParticipantProfileComplete,
  missingParticipantProfileFields,
} from "@/server/domain/participant-profile";

describe("participant profile completeness", () => {
  it("accepts a complete profile", () => {
    expect(
      isParticipantProfileComplete({
        fullName: "Nguyen Van A",
        institution: "UET",
        studentId: "20001234",
      }),
    ).toBe(true);
    expect(missingParticipantProfileFields({
      fullName: "Nguyen Van A",
      institution: "UET",
      studentId: "20001234",
    })).toEqual([]);
  });

  it("rejects missing fields", () => {
    expect(
      isParticipantProfileComplete({
        fullName: "Nguyen Van A",
        institution: "",
        studentId: "20001234",
      }),
    ).toBe(false);
    expect(
      missingParticipantProfileFields({
        fullName: "Nguyen Van A",
        institution: "",
        studentId: null,
      }),
    ).toEqual(["trường", "mã sinh viên"]);
  });
});
