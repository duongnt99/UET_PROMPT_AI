"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatTimerClock } from "@/server/domain/match-setup";
import { activeTimer, useEventState } from "@/components/live/use-event-state";

function OverlayCurrentMatchInner() {
  const data = useEventState(1000);
  const compact = useSearchParams().get("compact") === "1";
  const match = data?.match;
  const timer = activeTimer(match?.timers);
  return (
    <div className="min-h-screen bg-transparent p-4 text-white">
      {!match ? (
        <p>Waiting</p>
      ) : (
        <div className={compact ? "text-xl" : "text-4xl font-semibold"}>
          {match.competitorA?.name} vs {match.competitorB?.name}
          {timer ? <span className="ml-4 font-mono tabular-nums">{formatTimerClock(timer.remainingSeconds)}</span> : null}
        </div>
      )}
    </div>
  );
}

export default function OverlayCurrentMatch() {
  return (
    <Suspense fallback={<p className="p-4 text-white">Waiting</p>}>
      <OverlayCurrentMatchInner />
    </Suspense>
  );
}
