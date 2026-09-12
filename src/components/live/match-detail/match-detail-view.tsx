"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { matchStatusLabel } from "@/lib/status-labels";
import type { PublicMatchDetail } from "@/types/public-match-detail";
import { MatchInfoSection } from "./match-info-section";
import { ScoreComparison } from "./score-comparison";
import { TeamPanel } from "./team-panel";

const LIVE_STATUSES = new Set([
  "SCHEDULED",
  "CHECK_IN",
  "READY",
  "SPRINT",
  "PITCH",
  "SCORING",
  "VERDICT",
  "TIE_REVIEW",
  "NEEDS_VERDICT",
]);

function pollIntervalMs(status: string) {
  return LIVE_STATUSES.has(status) ? 4000 : 20000;
}

export function MatchDetailView({ initialData }: { initialData: PublicMatchDetail }) {
  const [match, setMatch] = useState(initialData);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (status: string) => {
      if (!active) return;
      timer = setTimeout(() => {
        void refresh(status);
      }, pollIntervalMs(status));
    };

    const refresh = async (status: string) => {
      if (inFlight.current) {
        schedule(status);
        return;
      }
      inFlight.current = true;
      try {
        const response = await fetch(`/api/public/matches/${match.id}`, { cache: "no-store" });
        if (response.ok && active) {
          const next = (await response.json()) as PublicMatchDetail;
          setMatch(next);
          schedule(next.status);
          return;
        }
      } catch {
        // Giữ dữ liệu gần nhất.
      } finally {
        inFlight.current = false;
      }
      schedule(status);
    };

    schedule(initialData.status);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [initialData.status, match.id]);

  const winnerId = match.winner?.id ?? null;
  const winnerA = winnerId != null && match.competitorA?.id === winnerId;
  const winnerB = winnerId != null && match.competitorB?.id === winnerId;
  const winnerLabel = match.isFinalRound ? "🏆 VÔ ĐỊCH" : "✓ Đội thắng";

  return (
    <div>
      <Link
        href="/scoreboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        ← Quay lại Bảng đấu trực tiếp
      </Link>

      <header className="mt-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-600">
          {match.round.displayName} · {match.code}
        </p>
        <p className="mt-2 inline-flex rounded-full bg-slate-800 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {matchStatusLabel(match.status)}
        </p>
      </header>

      <div className="mt-8 flex flex-col items-center gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-8">
        <TeamPanel
          competitor={match.competitorA}
          isWinner={winnerA}
          winnerLabel={winnerA ? winnerLabel : null}
        />
        <div className="flex items-center justify-center py-2 lg:py-16">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold uppercase tracking-widest text-slate-700">
            VS
          </span>
        </div>
        <TeamPanel
          competitor={match.competitorB}
          isWinner={winnerB}
          winnerLabel={winnerB ? winnerLabel : null}
        />
      </div>

      <div className="mt-8 space-y-6">
        <MatchInfoSection match={match} />
        <ScoreComparison match={match} />
      </div>

      <p className="mt-4 text-xs text-slate-500" aria-live="polite">
        Tự động cập nhật · Cập nhật gần nhất: {new Date(match.updatedAt).toLocaleTimeString("vi-VN")}
      </p>
    </div>
  );
}
