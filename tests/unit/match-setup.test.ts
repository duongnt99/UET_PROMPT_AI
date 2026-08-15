import { describe, expect, it } from "vitest";
import { assertLiveMatchSetup, normalizeMatchCode, assertCanChangePairing } from "@/server/domain/match-setup";
import { canTransition, MATCH_TRANSITIONS } from "@/server/domain/status-transitions";

describe("live match setup", () => {
  it("rejects the same finalist on both sides", () => {
    expect(() =>
      assertLiveMatchSetup({ competitorAId: "a", competitorBId: "a", judgeIds: ["j1"] }),
    ).toThrow(/hai finalist khác nhau/i);
  });

  it("requires at least one judge", () => {
    expect(() =>
      assertLiveMatchSetup({ competitorAId: "a", competitorBId: "b", judgeIds: [] }),
    ).toThrow(/ít nhất một giám khảo/i);
  });

  it("normalizes match codes and drops duplicate judges", () => {
    const result = assertLiveMatchSetup({
      competitorAId: "a",
      competitorBId: "b",
      judgeIds: ["j1", "j1", " j2 "],
      code: "pi-3",
    });
    expect(result.judgeIds).toEqual(["j1", "j2"]);
    expect(result.code).toBe("PI-3");
    expect(normalizeMatchCode(" live 1 ")).toBe("LIVE-1");
  });
});

describe("pairing and match status rules", () => {
  it("blocks pairing changes after submitted scores or completion", () => {
    expect(() =>
      assertCanChangePairing({ status: "SCORING", bracketLocked: false, submittedScoreCount: 1 }),
    ).toThrow(/phiếu giám khảo/i);
    expect(() =>
      assertCanChangePairing({ status: "COMPLETED", bracketLocked: false, submittedScoreCount: 0 }),
    ).toThrow(/hoàn thành/i);
  });

  it("allows pairing changes while scoring if no ballots were submitted", () => {
    expect(() =>
      assertCanChangePairing({ status: "SCORING", bracketLocked: false, submittedScoreCount: 0 }),
    ).not.toThrow();
  });

  it("allows cancelling a live match and reopening a cancelled one", () => {
    expect(canTransition(MATCH_TRANSITIONS, "SCORING", "CANCELLED")).toBe(true);
    expect(canTransition(MATCH_TRANSITIONS, "CANCELLED", "SCORING")).toBe(true);
    expect(canTransition(MATCH_TRANSITIONS, "COMPLETED", "CANCELLED")).toBe(false);
  });
});
