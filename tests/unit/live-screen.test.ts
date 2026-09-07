import { describe, expect, it } from "vitest";
import {
  assertCanPublishLiveScreen,
  assertCanWatchLiveScreen,
  assertRegistrationBelongsToContestSession,
  chooseAvailableScreenSlot,
} from "@/server/domain/live-screen";

describe("live screen authorization", () => {
  it("blocks a participant from publishing as another user or another team", () => {
    expect(() =>
      assertCanPublishLiveScreen({
        authenticatedUserId: "participant-a",
        requestedParticipantId: "participant-b",
        isEligibleCompetitor: true,
        isCurrentContestSession: true,
        matchStatus: "SPRINT",
      }),
    ).toThrow("Danh tính");
    expect(() =>
      assertCanPublishLiveScreen({
        authenticatedUserId: "participant-a",
        isEligibleCompetitor: false,
        isCurrentContestSession: true,
        matchStatus: "SPRINT",
      }),
    ).toThrow("không thuộc đội");
  });

  it("blocks non-admin viewers", () => {
    expect(() => assertCanWatchLiveScreen(["PARTICIPANT"])).toThrow("không có quyền");
    expect(() => assertCanWatchLiveScreen(["ADMIN"])).not.toThrow();
    expect(() => assertCanWatchLiveScreen(["TECH_OPERATOR"])).not.toThrow();
  });

  it("allows sharing while judges are scoring the current match", () => {
    expect(() =>
      assertCanPublishLiveScreen({
        authenticatedUserId: "participant-a",
        isEligibleCompetitor: true,
        isCurrentContestSession: true,
        matchStatus: "SCORING",
      }),
    ).not.toThrow();
  });

  it("rejects a registration outside the requested contest session", () => {
    expect(() =>
      assertRegistrationBelongsToContestSession({
        requestedRegistrationId: "registration-c",
        competitorRegistrationIds: ["registration-a", "registration-b"],
      }),
    ).toThrow("không thuộc phiên thi");
  });
});

describe("live screen slots", () => {
  it("allocates at most two active slots", () => {
    expect(chooseAvailableScreenSlot([])).toBe(1);
    expect(chooseAvailableScreenSlot([1])).toBe(2);
    expect(() => chooseAvailableScreenSlot([1, 2])).toThrow("đủ 2 luồng");
  });

  it("makes a released slot available again", () => {
    expect(chooseAvailableScreenSlot([2])).toBe(1);
  });
});
