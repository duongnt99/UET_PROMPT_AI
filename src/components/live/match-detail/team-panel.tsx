import type { PublicMatchCompetitor } from "@/types/public-match-detail";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamPanel({
  competitor,
  isWinner,
  winnerLabel,
}: {
  competitor: PublicMatchCompetitor | null;
  isWinner: boolean;
  winnerLabel: string | null;
}) {
  if (!competitor) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm italic text-slate-400">
        Chưa xác định
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        isWinner ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"
      }`}
    >
      <div className="text-center">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 sm:text-xl">
          {competitor.displayName}
        </h2>
        {competitor.institutionPublic ? (
          <p className="mt-1 text-sm text-slate-600">{competitor.institutionPublic}</p>
        ) : null}
        {isWinner && winnerLabel ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
            {winnerLabel}
          </p>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2">
        {competitor.members.map((member, index) => (
          <li
            key={`${member.displayName}-${index}`}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white"
              aria-hidden
            >
              {initials(member.displayName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{member.displayName}</p>
              {member.role ? <p className="truncate text-xs text-slate-500">{member.role}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
