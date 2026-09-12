export type TimerStatusValue = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";

export type TimerFields = {
  status: TimerStatusValue;
  durationSeconds: number;
  remainingSnapshot: number;
  startedAt: Date | null;
  pausedAt: Date | null;
  accumulatedPausedMs: number;
};

export function remainingTimerSeconds(params: {
  now: Date;
  status: TimerStatusValue;
  durationSeconds: number;
  remainingSnapshot: number;
  startedAt: Date | null;
  pausedAt: Date | null;
  accumulatedPausedMs: number;
}): number {
  const duration = Math.max(0, params.durationSeconds);

  if (params.status === "IDLE") return duration;
  if (params.status === "PAUSED" || params.status === "COMPLETED") {
    return Math.min(duration, Math.max(0, params.remainingSnapshot));
  }
  if (!params.startedAt) return duration;

  const elapsedMs =
    params.now.getTime() - params.startedAt.getTime() - Math.max(0, params.accumulatedPausedMs);
  const remaining = duration - Math.floor(elapsedMs / 1000);
  return Math.min(duration, Math.max(0, remaining));
}

export function timerHasExpired(params: { now: Date } & TimerFields) {
  return params.status === "RUNNING" && remainingTimerSeconds(params) <= 0;
}

/** When stopping/pausing all running timers (e.g. match stop), expired timers become COMPLETED. */
export function runningTimerStopUpdate(
  now: Date,
  timer: TimerFields,
): { status: "COMPLETED" | "PAUSED"; remainingSnapshot: number; pausedAt: Date | null } {
  const remaining = remainingTimerSeconds({
    now,
    status: "RUNNING",
    durationSeconds: timer.durationSeconds,
    remainingSnapshot: timer.remainingSnapshot,
    startedAt: timer.startedAt,
    pausedAt: timer.pausedAt,
    accumulatedPausedMs: timer.accumulatedPausedMs,
  });
  if (remaining <= 0) {
    return { status: "COMPLETED", remainingSnapshot: 0, pausedAt: null };
  }
  return { status: "PAUSED", remainingSnapshot: remaining, pausedAt: now };
}

export type SerializedTimerState = {
  id: string;
  kind: string;
  status: TimerStatusValue;
  durationSeconds: number;
  remainingSnapshot: number;
  startedAt: string | null;
  pausedAt: string | null;
  accumulatedPausedMs: number;
  version: number;
  remainingSeconds: number;
};

export function serializeTimerState(
  timer: {
    id: string;
    kind: string;
    status: TimerStatusValue;
    durationSeconds: number;
    remainingSnapshot: number;
    startedAt: Date | null;
    pausedAt: Date | null;
    accumulatedPausedMs: number;
    version: number;
  },
  now: Date,
): SerializedTimerState {
  const fields = {
    status: timer.status,
    durationSeconds: timer.durationSeconds,
    remainingSnapshot: timer.remainingSnapshot,
    startedAt: timer.startedAt,
    pausedAt: timer.pausedAt,
    accumulatedPausedMs: timer.accumulatedPausedMs,
  };
  const remainingSeconds = remainingTimerSeconds({ now, ...fields });
  const status =
    timer.status === "RUNNING" && remainingSeconds <= 0 ? "COMPLETED" : timer.status;
  const normalizedRemaining =
    status === "COMPLETED" ? 0 : status === "PAUSED" ? remainingSeconds : remainingSeconds;

  return {
    id: timer.id,
    kind: timer.kind,
    status,
    durationSeconds: timer.durationSeconds,
    remainingSnapshot: status === "COMPLETED" ? 0 : timer.remainingSnapshot,
    startedAt: timer.startedAt?.toISOString() ?? null,
    pausedAt: timer.pausedAt?.toISOString() ?? null,
    accumulatedPausedMs: timer.accumulatedPausedMs,
    version: timer.version,
    remainingSeconds: normalizedRemaining,
  };
}
