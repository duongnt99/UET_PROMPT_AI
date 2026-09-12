"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Badge } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatTimerClock } from "@/server/domain/match-setup";
import {
  remainingTimerSeconds,
  type SerializedTimerState,
  type TimerStatusValue,
} from "@/server/domain/timer";
import { timerKindLabel, timerStatusLabel } from "@/lib/status-labels";
import { matchTimerAction, type MatchSetupState } from "@/server/actions/admin-match-actions";

const idle: MatchSetupState = { ok: true, message: "" };
const SYNC_INTERVAL_MS = 2000;
const TICK_INTERVAL_MS = 1000;

function computeRemaining(timer: SerializedTimerState, now: Date) {
  return remainingTimerSeconds({
    now,
    status: timer.status,
    durationSeconds: timer.durationSeconds,
    remainingSnapshot: timer.remainingSnapshot,
    startedAt: timer.startedAt ? new Date(timer.startedAt) : null,
    pausedAt: timer.pausedAt ? new Date(timer.pausedAt) : null,
    accumulatedPausedMs: timer.accumulatedPausedMs,
  });
}

function displayTimerStatus(timer: SerializedTimerState, remaining: number): TimerStatusValue {
  if (timer.status === "RUNNING" && remaining <= 0) return "COMPLETED";
  return timer.status;
}

function TimerControls({
  matchId,
  timer,
  canControl,
  onSynced,
}: {
  matchId: string;
  timer: SerializedTimerState;
  canControl: boolean;
  onSynced: () => void;
}) {
  const [state, action, pending] = useActionState(matchTimerAction, idle);

  useEffect(() => {
    if (state.ok && state.message) {
      onSynced();
    }
  }, [state.ok, state.message, onSynced]);

  if (!canControl) return null;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="kind" value={timer.kind} />
      <Button name="action" value="start" size="sm" disabled={pending}>
        Bắt đầu
      </Button>
      <Button
        name="action"
        value="pause"
        size="sm"
        variant="outline"
        disabled={pending || timer.status !== "RUNNING"}
      >
        Tạm dừng
      </Button>
      <Button
        name="action"
        value="resume"
        size="sm"
        variant="outline"
        disabled={pending || timer.status !== "PAUSED"}
      >
        Tiếp tục
      </Button>
      {pending ? <span className="text-xs text-slate-500">Đang lưu…</span> : null}
      {state.message ? (
        <span className={state.ok ? "text-xs text-emerald-700" : "text-xs text-red-700"} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function AdminMatchTimers({
  matchId,
  initialTimers,
  canControl,
}: {
  matchId: string;
  initialTimers: SerializedTimerState[];
  canControl: boolean;
}) {
  const [timers, setTimers] = useState(initialTimers);
  const [now, setNow] = useState(() => new Date());
  const expiredSyncRequested = useRef<Set<string>>(new Set());

  const syncTimers = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/matches/${matchId}/timers`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { timers: SerializedTimerState[] };
      setTimers(payload.timers);
      setNow(new Date());
      for (const timer of payload.timers) {
        if (timer.status === "RUNNING") {
          expiredSyncRequested.current.delete(timer.id);
        }
      }
    } catch {
      // ignore transient network errors
    }
  }, [matchId]);

  useEffect(() => {
    const tickId = window.setInterval(() => setNow(new Date()), TICK_INTERVAL_MS);
    return () => window.clearInterval(tickId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const runSync = () => {
      if (!cancelled) void syncTimers();
    };
    const initialId = window.setTimeout(runSync, 0);
    const syncId = window.setInterval(runSync, SYNC_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(initialId);
      window.clearInterval(syncId);
    };
  }, [syncTimers]);

  useEffect(() => {
    for (const timer of timers) {
      const remaining = computeRemaining(timer, now);
      if (timer.status === "RUNNING" && remaining <= 0) {
        if (!expiredSyncRequested.current.has(timer.id)) {
          expiredSyncRequested.current.add(timer.id);
          void syncTimers();
        }
      }
    }
  }, [timers, now, syncTimers]);

  if (timers.length === 0) {
    return (
      <p className="mt-2 text-sm text-slate-600">
        Chưa có đồng hồ. Chuyển trận sang “Sẵn sàng” hoặc “Đang chấm điểm” để tạo.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {timers.map((timer) => {
        const remaining = computeRemaining(timer, now);
        const status = displayTimerStatus(timer, remaining);
        return (
          <div key={timer.id} className="rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {timerKindLabel(timer.kind)} ·{" "}
                <span className="font-mono tabular-nums">{formatTimerClock(remaining)}</span>{" "}
                <Badge>{timerStatusLabel(status)}</Badge>
              </p>
              <TimerControls
                matchId={matchId}
                timer={timer}
                canControl={canControl}
                onSynced={syncTimers}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
