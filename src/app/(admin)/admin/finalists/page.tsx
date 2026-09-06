import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import { rankSubmissions } from "@/server/services/review-service";
import { getProductionCompetition } from "@/server/services/competition-service";
import { registrationPublicLabel } from "@/server/services/finalist-service";
import { requirePermission } from "@/lib/auth/guards";
import { FinalistStatusForms, LockFinalistsForm, PublishFinalistsForm } from "@/components/admin/finalist-forms";
import { formatScoreDisplay } from "@/server/domain/scoring";

export default async function Page() {
  await requirePermission("finalist:manage");
  const competition = await getProductionCompetition();
  const ranking = competition ? await rankSubmissions(competition.id) : [];
  const rankByRegistration = new Map(ranking.map((row) => [row.registrationId, row]));
  const registrations = competition
    ? await prisma.registration.findMany({
        where: {
          competitionId: competition.id,
          deletedAt: null,
          status: { notIn: ["DRAFT", "WITHDRAWN"] },
        },
        include: { team: true, owner: { include: { profile: true } }, finalist: true },
        orderBy: { code: "asc" },
      })
    : [];
  const finalists = await prisma.finalist.findMany({
    include: { registration: { include: { team: true, owner: { include: { profile: true } } } } },
    orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
  });

  const candidates = registrations.map((item) => {
    const rank = rankByRegistration.get(item.id);
    return {
      id: item.id,
      label: `${registrationPublicLabel(item)} · ${item.code}`,
      status: item.status,
      alreadySelected: item.status === "SELECTED",
      rankHint: rank
        ? `${rank.completedReviews}/${rank.assignedReviews} review${rank.aggregate ? ` · ${formatScoreDisplay(rank.aggregate)}` : " · chưa đủ điểm"}`
        : "chưa có bài Audition trong bảng xếp hạng",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl">Đội vào chung kết</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          BTC chọn hồ sơ vào chung kết (không tự nhảy từ điểm Audition). Khóa lựa chọn → hồ sơ{" "}
          <strong>SELECTED</strong> + bản ghi Finalist. Công bố riêng hoặc hàng loạt thì mới hiện trên{" "}
          <code>/finalists</code>. Có thể bỏ SELECTED hoặc ẩn công khai bất kỳ lúc nào (trừ khi đội đang thi).
        </p>
      </div>

      <Card>
        <h2 className="font-semibold">Bảng xếp hạng Audition (tham khảo)</h2>
        <ul className="mt-2 text-sm">
          {ranking.length === 0 ? <li className="text-slate-500">Chưa có bài được chấm.</li> : null}
          {ranking.map((row, index) => (
            <li key={row.submissionId}>
              #{index + 1} {row.code} — {row.aggregate ? formatScoreDisplay(row.aggregate) : "chưa đủ điểm"} (
              {row.completedReviews}/{row.assignedReviews} review)
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Chọn vào chung kết</h2>
        <div className="mt-3">
          <LockFinalistsForm candidates={candidates} />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Công bố công khai</h2>
        <div className="mt-3">
          <PublishFinalistsForm />
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="font-semibold">Danh sách đội vào chung kết</h2>
        {finalists.length === 0 ? <p className="text-sm text-slate-600">Chưa có finalist.</p> : null}
        {finalists.map((item) => {
          const selected = item.registration.status === "SELECTED";
          return (
            <Card key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{item.displayName}</p>
                <Badge>{item.registration.code}</Badge>
                <Badge tone={selected ? "green" : "slate"}>{item.registration.status}</Badge>
                <Badge tone={item.published ? "gold" : "slate"}>
                  {item.published ? "Công khai" : "Chưa công bố"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {item.institutionPublic ?? "—"}
                {item.seed != null ? ` · seed ${item.seed}` : ""}
              </p>
              <FinalistStatusForms finalistId={item.id} published={item.published} selected={selected} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
