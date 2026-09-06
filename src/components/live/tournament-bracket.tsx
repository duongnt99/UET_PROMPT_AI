"use client";

import { useEffect, useState } from "react";
import { matchStatusLabel } from "@/lib/status-labels";

export type PublicBracketData = {
  enabled: boolean;
  updatedAt: string;
  rounds: Array<{
    id: string;
    name: string;
    matches: Array<{
      id: string;
      code: string;
      status: string;
      competitorA: string | null;
      competitorB: string | null;
      winner: string | null;
    }>;
  }>;
};

function TeamRow({ name, winner }: { name: string | null; winner: boolean }) {
  return (
    <div className={`flex min-h-9 items-center justify-between gap-3 px-3 py-2 text-sm ${winner ? "bg-emerald-50 font-bold text-emerald-800" : "bg-white"}`}>
      <span className={!name ? "italic text-slate-400" : ""}>{name ?? "Chưa xác định"}</span>
      {winner ? <span aria-label="Đội thắng" title="Đội thắng">✓</span> : null}
    </div>
  );
}

export function TournamentBracket({ initialData }: { initialData: PublicBracketData }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/public/bracket", { cache: "no-store" });
        if (response.ok && active) setData((await response.json()) as PublicBracketData);
      } catch {
        // Giữ dữ liệu gần nhất nếu đường truyền trình chiếu chập chờn.
      }
    };
    const timer = window.setInterval(refresh, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!data.enabled) return <p className="rounded-2xl border bg-white p-5">Bảng đấu chưa được mở công khai.</p>;
  if (!data.rounds.length) return <p className="rounded-2xl border bg-white p-5">Chưa có cặp đấu nào.</p>;

  const champion = [...data.rounds].reverse().flatMap((round) => round.matches).find((match) => match.winner)?.winner;

  return (
    <div>
      <div className="overflow-x-auto pb-4">
        <div className="grid min-w-[880px] auto-cols-fr grid-flow-col gap-8 rounded-3xl bg-slate-100/80 p-6">
          {data.rounds.map((round) => (
            <section key={round.id} className="flex min-w-52 flex-col">
              <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-slate-600">{round.name}</h2>
              <div className="flex flex-1 flex-col justify-around gap-6">
                {round.matches.map((match) => (
                  <article key={match.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-slate-800 px-3 py-1.5 text-xs text-white">
                      <span>{match.code}</span>
                      <span>{matchStatusLabel(match.status)}</span>
                    </div>
                    <TeamRow name={match.competitorA} winner={Boolean(match.winner && match.winner === match.competitorA)} />
                    <div className="border-t border-slate-100" />
                    <TeamRow name={match.competitorB} winner={Boolean(match.winner && match.winner === match.competitorB)} />
                  </article>
                ))}
              </div>
            </section>
          ))}
          <section className="flex min-w-52 flex-col justify-center">
            <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-amber-700">Vô địch</h2>
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center shadow-sm">
              <p className="text-3xl" aria-hidden>🏆</p>
              <p className={`mt-2 font-bold ${champion ? "text-slate-900" : "italic text-slate-400"}`}>
                {champion ?? "Chưa xác định"}
              </p>
            </div>
          </section>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500" aria-live="polite">
        Tự động cập nhật 3 giây/lần · Cập nhật gần nhất: {new Date(data.updatedAt).toLocaleTimeString("vi-VN")}
      </p>
    </div>
  );
}
