import { describe, expect, it } from "vitest";
import { remainingTimerSeconds } from "@/server/domain/timer";

describe("server authoritative timer", () => {
  it("subtracts elapsed running time", () => {
    const remaining = remainingTimerSeconds({
      now: new Date("2026-11-01T10:00:10.000Z"),
      status: "RUNNING",
      durationSeconds: 60,
      remainingSnapshot: 60,
      startedAt: new Date("2026-11-01T10:00:00.000Z"),
      pausedAt: null,
      accumulatedPausedMs: 0,
    });
    expect(remaining).toBe(50);
  });
});
