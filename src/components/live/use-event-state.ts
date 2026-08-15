"use client";

import { useEffect, useState } from "react";

export type LiveTimer = {
  kind?: string;
  status?: string;
  remainingSeconds: number;
};

export type LiveMatch = {
  code?: string;
  status?: string;
  round?: string;
  competitorA?: { name: string } | null;
  competitorB?: { name: string } | null;
  timers?: LiveTimer[];
  twist?: { title: string; content: string } | null;
};

export type LiveEventState = {
  match: LiveMatch | null;
};

export function useEventState(intervalMs = 1000) {
  const [data, setData] = useState<LiveEventState | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/public/event-state", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload: LiveEventState) => {
          if (!cancelled) setData(payload);
        })
        .catch(() => undefined);
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);
  return data;
}

export function activeTimer(timers: LiveTimer[] | undefined) {
  if (!timers?.length) return null;
  return timers.find((timer) => timer.status === "RUNNING") ?? timers[0] ?? null;
}
