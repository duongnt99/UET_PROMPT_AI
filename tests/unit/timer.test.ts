import { describe, expect, it } from "vitest";
import {
  remainingTimerSeconds,
  runningTimerStopUpdate,
  serializeTimerState,
  timerHasExpired,
} from "@/server/domain/timer";

const DURATION = 300;
const T0 = new Date("2026-11-01T10:00:00.000Z");

function runningAt(elapsedSeconds: number, accumulatedPausedMs = 0) {
  return remainingTimerSeconds({
    now: new Date(T0.getTime() + elapsedSeconds * 1000),
    status: "RUNNING",
    durationSeconds: DURATION,
    remainingSnapshot: DURATION,
    startedAt: T0,
    pausedAt: null,
    accumulatedPausedMs,
  });
}

describe("remainingTimerSeconds", () => {
  it("subtracts elapsed running time", () => {
    expect(runningAt(10)).toBe(290);
  });

  it("returns snapshot while paused", () => {
    const remaining = remainingTimerSeconds({
      now: new Date("2026-11-01T10:05:00.000Z"),
      status: "PAUSED",
      durationSeconds: DURATION,
      remainingSnapshot: 222,
      startedAt: T0,
      pausedAt: new Date("2026-11-01T10:01:00.000Z"),
      accumulatedPausedMs: 0,
    });
    expect(remaining).toBe(222);
  });

  it("never exceeds configured duration when accumulatedPausedMs was not reset", () => {
    const remaining = remainingTimerSeconds({
      now: T0,
      status: "RUNNING",
      durationSeconds: DURATION,
      remainingSnapshot: DURATION,
      startedAt: T0,
      pausedAt: null,
      accumulatedPausedMs: 120_000,
    });
    expect(remaining).toBe(DURATION);
  });

  it("follows the full pause/resume timeline from the verification spec", () => {
    const startedAt = T0;

    expect(runningAt(40)).toBe(260);

    const pausedAt = new Date(T0.getTime() + 40_000);
    const pausedRemaining = remainingTimerSeconds({
      now: pausedAt,
      status: "RUNNING",
      durationSeconds: DURATION,
      remainingSnapshot: DURATION,
      startedAt,
      pausedAt: null,
      accumulatedPausedMs: 0,
    });
    expect(pausedRemaining).toBe(260);

    const whilePaused = remainingTimerSeconds({
      now: new Date(pausedAt.getTime() + 20_000),
      status: "PAUSED",
      durationSeconds: DURATION,
      remainingSnapshot: pausedRemaining,
      startedAt,
      pausedAt,
      accumulatedPausedMs: 0,
    });
    expect(whilePaused).toBe(260);

    const resumedAt = new Date(pausedAt.getTime() + 20_000);
    const pauseDurationMs = 20_000;
    expect(
      remainingTimerSeconds({
        now: new Date(resumedAt.getTime() + 10_000),
        status: "RUNNING",
        durationSeconds: DURATION,
        remainingSnapshot: pausedRemaining,
        startedAt,
        pausedAt: null,
        accumulatedPausedMs: pauseDurationMs,
      }),
    ).toBe(250);

    const secondPausedAt = new Date(resumedAt.getTime() + 10_000);
    const secondPausedRemaining = 250;
    const secondPauseMs = 30_000;
    expect(
      remainingTimerSeconds({
        now: new Date(secondPausedAt.getTime() + secondPauseMs + 5_000),
        status: "RUNNING",
        durationSeconds: DURATION,
        remainingSnapshot: secondPausedRemaining,
        startedAt,
        pausedAt: null,
        accumulatedPausedMs: pauseDurationMs + secondPauseMs,
      }),
    ).toBe(245);

    const freshStart = remainingTimerSeconds({
      now: new Date("2026-11-01T10:10:00.000Z"),
      status: "RUNNING",
      durationSeconds: DURATION,
      remainingSnapshot: DURATION,
      startedAt: new Date("2026-11-01T10:10:00.000Z"),
      pausedAt: null,
      accumulatedPausedMs: 0,
    });
    expect(freshStart).toBe(DURATION);
  });

  it("clamps completed timers to zero", () => {
    const remaining = remainingTimerSeconds({
      now: new Date("2026-11-01T10:10:00.000Z"),
      status: "COMPLETED",
      durationSeconds: DURATION,
      remainingSnapshot: 0,
      startedAt: T0,
      pausedAt: null,
      accumulatedPausedMs: 0,
    });
    expect(remaining).toBe(0);
  });

  it("clamps boundary at zero for overrun elapsed time", () => {
    expect(runningAt(DURATION + 25)).toBe(0);
  });

  it("derives correct remaining after tab background/sleep using timestamps only", () => {
    const afterSleep = remainingTimerSeconds({
      now: new Date(T0.getTime() + 30_000),
      status: "RUNNING",
      durationSeconds: DURATION,
      remainingSnapshot: DURATION,
      startedAt: T0,
      pausedAt: null,
      accumulatedPausedMs: 0,
    });
    expect(afterSleep).toBe(270);
  });
});

describe("serializeTimerState", () => {
  it("reports COMPLETED when RUNNING timer is past deadline", () => {
    const serialized = serializeTimerState(
      {
        id: "timer-1",
        kind: "SPRINT",
        status: "RUNNING",
        durationSeconds: DURATION,
        remainingSnapshot: DURATION,
        startedAt: T0,
        pausedAt: null,
        accumulatedPausedMs: 0,
        version: 1,
      },
      new Date(T0.getTime() + DURATION * 1000 + 5_000),
    );
    expect(serialized.status).toBe("COMPLETED");
    expect(serialized.remainingSeconds).toBe(0);
  });
});

describe("timerHasExpired", () => {
  it("detects expired running timers", () => {
    expect(
      timerHasExpired({
        now: new Date(T0.getTime() + DURATION * 1000),
        status: "RUNNING",
        durationSeconds: DURATION,
        remainingSnapshot: DURATION,
        startedAt: T0,
        pausedAt: null,
        accumulatedPausedMs: 0,
      }),
    ).toBe(true);
  });
});

describe("runningTimerStopUpdate", () => {
  const fields = {
    status: "RUNNING" as const,
    durationSeconds: DURATION,
    remainingSnapshot: DURATION,
    startedAt: T0,
    pausedAt: null,
    accumulatedPausedMs: 0,
  };

  it("completes expired running timers instead of pausing at zero", () => {
    const now = new Date(T0.getTime() + DURATION * 1000 + 5_000);
    expect(runningTimerStopUpdate(now, fields)).toEqual({
      status: "COMPLETED",
      remainingSnapshot: 0,
      pausedAt: null,
    });
  });

  it("pauses running timers with remaining time above zero", () => {
    const now = new Date(T0.getTime() + 40_000);
    const update = runningTimerStopUpdate(now, fields);
    expect(update.status).toBe("PAUSED");
    expect(update.remainingSnapshot).toBe(260);
    expect(update.pausedAt).toEqual(now);
  });
});
