import type { PublicMatchDetail } from "@/types/public-match-detail";

export function ScoreComparison({ match }: { match: PublicMatchDetail }) {
  const teamAName = match.competitorA?.displayName ?? "Đội A";
  const teamBName = match.competitorB?.displayName ?? "Đội B";

  if (!match.scoresVisible) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Kết quả chấm điểm</h2>
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          🔒 Ban Tổ chức chưa công khai điểm số.
        </p>
      </section>
    );
  }

  if (!match.scoresComplete) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Kết quả chấm điểm</h2>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Kết quả đang được Ban Tổ chức cập nhật.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Kết quả chấm điểm</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[20rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Tiêu chí</th>
              <th className="py-2 pr-3 text-right font-medium">{teamAName}</th>
              <th className="py-2 text-right font-medium">{teamBName}</th>
            </tr>
          </thead>
          <tbody>
            {match.scoreBreakdown.map((row) => (
              <tr key={row.criterionId} className="border-b border-slate-100">
                <td className="py-3 pr-3">
                  <span className="font-medium text-slate-900">{row.criterionName}</span>
                  {row.weight != null ? (
                    <span className="mt-0.5 block text-xs text-slate-500">Trọng số {row.weight}%</span>
                  ) : null}
                </td>
                <td className="py-3 pr-3 text-right font-semibold text-slate-900">{row.teamAScore}</td>
                <td className="py-3 text-right font-semibold text-slate-900">{row.teamBScore}</td>
              </tr>
            ))}
            {match.totals ? (
              <tr className="border-t-2 border-slate-300 font-bold">
                <td className="py-3 pr-3 uppercase tracking-wide text-slate-700">Tổng</td>
                <td className="py-3 pr-3 text-right text-slate-900">{match.totals.teamA}</td>
                <td className="py-3 text-right text-slate-900">{match.totals.teamB}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Điểm tiêu chí là trung bình thang chấm của giám khảo; tổng điểm là trung bình điểm chuẩn hóa theo rubric chung kết.
      </p>
    </section>
  );
}
