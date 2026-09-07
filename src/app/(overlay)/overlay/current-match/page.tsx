"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatTimerClock } from "@/server/domain/match-setup";
import { activeTimer, useEventState } from "@/components/live/use-event-state";
import { MatchDualScreenMonitor, type MatchScreenSide } from "@/components/live/match-dual-screen-monitor";

type ScreenContext = {
  contestSessionId: string;
  sides: [MatchScreenSide, MatchScreenSide];
};

function useCurrentScreenContext(intervalMs = 3000) {
  const [context, setContext] = useState<ScreenContext | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetch("/api/live-screen/current-match", { cache: "no-store" })
        .then((response) => {
          if (response.status === 401 || response.status === 403) {
            if (!cancelled) setAccessDenied(true);
            return null;
          }
          if (!response.ok) throw new Error("Không tải được thông tin màn hình.");
          return response.json() as Promise<ScreenContext | null>;
        })
        .then((payload) => {
          if (!cancelled && payload) {
            setContext(payload);
            setAccessDenied(false);
          }
        })
        .catch(() => undefined);
    };
    load();
    const timerId = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
  }, [intervalMs]);
  return { context, accessDenied };
}

function OverlayCurrentMatchInner() {
  const data = useEventState(1000);
  const { context, accessDenied } = useCurrentScreenContext();
  const compact = useSearchParams().get("compact") === "1";
  const match = data?.match;
  const timer = activeTimer(match?.timers);
  return (
    <div className="min-h-screen bg-transparent p-4 text-white">
      {!match ? (
        <p className="inline-flex rounded-xl bg-black/85 px-4 py-3 font-semibold shadow-xl">Đang chờ trận hiện tại</p>
      ) : (
        <div className="space-y-4">
          <div className="inline-block max-w-5xl rounded-2xl border border-white/15 bg-black/85 px-5 py-4 shadow-2xl backdrop-blur-sm">
            <div className={compact ? "text-xl font-semibold" : "text-4xl font-semibold"}>
              {match.competitorA?.name} <span className="text-white/55">vs</span> {match.competitorB?.name}
              {timer ? <span className="ml-4 rounded-lg bg-white/10 px-2 font-mono tabular-nums text-amber-300">{formatTimerClock(timer.remainingSeconds)}</span> : null}
            </div>
            {match.problem?.title ? (
              <p className={compact ? "mt-2 text-sm text-white/85" : "mt-3 text-xl text-white/90"}>{match.problem.title}</p>
            ) : null}
            {!compact && match.problem?.prompt ? (
              <p className="mt-2 max-w-4xl whitespace-pre-wrap text-lg leading-7 text-white/75">{match.problem.prompt}</p>
            ) : null}
          </div>
          {!compact && context ? (
            <MatchDualScreenMonitor contestSessionId={context.contestSessionId} sides={context.sides} variant="overlay" />
          ) : null}
          {!compact && accessDenied ? (
            <p className="inline-flex rounded-xl bg-black/85 px-4 py-2 text-sm text-amber-200 shadow-xl">
              Đăng nhập bằng tài khoản Ban tổ chức để xem màn hình trực tiếp của hai đội.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function OverlayCurrentMatch() {
  return (
    <Suspense fallback={<p className="m-4 inline-flex rounded-xl bg-black/85 px-4 py-3 text-white">Đang tải overlay</p>}>
      <OverlayCurrentMatchInner />
    </Suspense>
  );
}
