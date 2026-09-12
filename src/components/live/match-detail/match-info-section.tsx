import { formatDateTime } from "@/lib/dates";
import { formatMatchDurationLabel } from "@/server/domain/public-match-scoring";
import type { PublicMatchDetail } from "@/types/public-match-detail";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function MatchInfoSection({ match }: { match: PublicMatchDetail }) {
  const durationLabel = formatMatchDurationLabel(match.durationMs);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Thông tin trận đấu</h2>
      <div className="mt-3">
        <InfoRow label="Thời gian dự kiến" value={match.scheduledAt ? formatDateTime(match.scheduledAt) : null} />
        <InfoRow label="Bắt đầu thực tế" value={match.actualStartedAt ? formatDateTime(match.actualStartedAt) : null} />
        <InfoRow label="Kết thúc" value={match.actualEndedAt ? formatDateTime(match.actualEndedAt) : null} />
        <InfoRow label="Thời lượng trận" value={durationLabel} />
      </div>
      {match.timers.length ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đồng hồ</p>
          <div className="mt-2 space-y-2">
            {match.timers.map((timer) => (
              <div
                key={timer.kind}
                className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-slate-800">{timer.kindLabel}</span>
                <span className="text-sm text-slate-600">
                  {timer.statusLabel}
                  {timer.remainingSeconds != null ? ` · ${timer.remainingSeconds}s / ${timer.durationSeconds}s` : ` · ${timer.durationSeconds}s`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
