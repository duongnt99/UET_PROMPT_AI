"use client";

import { formatTimerClock } from "@/server/domain/match-setup";
import { activeTimer, useEventState } from "@/components/live/use-event-state";

const STATUS_LABEL: Record<string, string> = {
  RUNNING: "Đang chạy",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hết giờ",
  IDLE: "Chưa chạy",
};

export function StageCurrentMatchScreen() {
  const data = useEventState(1000);
  const match = data?.match;
  const timer = activeTimer(match?.timers);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1F3A] p-8 text-white">
      {!match ? (
        <p className="text-3xl">{data ? "Chưa có trận hiện tại" : "Đang tải…"}</p>
      ) : (
        <div className="text-center">
          <p className="text-xl text-[#C9A227]">{match.round}</p>
          <h1 className="display mt-4 text-6xl font-semibold">
            {match.competitorA?.name ?? "TBD"} vs {match.competitorB?.name ?? "TBD"}
          </h1>
          <p className="mt-6 text-2xl">{match.status}</p>
          {match.problem?.title || match.problem?.prompt ? (
            <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-white/15 bg-white/5 p-6 text-left">
              <p className="text-sm uppercase tracking-wide text-[#C9A227]">Đề thi chung</p>
              {match.problem?.title ? <h2 className="mt-2 text-3xl font-semibold">{match.problem.title}</h2> : null}
              {match.problem?.prompt ? (
                <p className="mt-3 whitespace-pre-wrap text-lg text-white/80">{match.problem.prompt}</p>
              ) : null}
            </div>
          ) : null}
          {timer ? (
            <div className="mt-8">
              <p className="font-mono text-8xl tabular-nums">{formatTimerClock(timer.remainingSeconds)}</p>
              <p className="mt-3 text-lg text-white/70">
                {timer.kind ?? "Timer"} · {STATUS_LABEL[timer.status ?? ""] ?? timer.status}
              </p>
            </div>
          ) : (
            <p className="mt-8 text-2xl text-white/60">Chưa có đồng hồ</p>
          )}
        </div>
      )}
    </div>
  );
}
