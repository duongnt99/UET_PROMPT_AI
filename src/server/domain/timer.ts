export function remainingTimerSeconds(params: {
  now: Date;
  status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";
  durationSeconds: number;
  remainingSnapshot: number;
  startedAt: Date | null;
  pausedAt: Date | null;
  accumulatedPausedMs: number;
}): number {
  if (params.status === "IDLE") return params.durationSeconds;
  if (params.status === "PAUSED" || params.status === "COMPLETED") {
    return Math.max(0, params.remainingSnapshot);
  }
  if (!params.startedAt) return params.durationSeconds;
  const elapsedMs =
    params.now.getTime() - params.startedAt.getTime() - params.accumulatedPausedMs;
  const remaining = params.durationSeconds - Math.floor(elapsedMs / 1000);
  return Math.max(0, remaining);
}
