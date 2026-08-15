import { prisma } from "@/lib/db/prisma";
import { storageHealth } from "@/lib/storage";
import { Card } from "@/components/ui/form";
import { timerAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { getProductionCompetition } from "@/server/services/competition-service";
import { requirePermission } from "@/lib/auth/guards";
import Link from "next/link";

export default async function Page() {
  await requirePermission("operations:control");
  const competition = await getProductionCompetition();
  const [emailFail, incidents, dbOk] = await Promise.all([
    prisma.emailOutbox.count({ where: { status: "FAILED" } }),
    prisma.incident.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.$queryRaw`SELECT 1`.then(() => "ok").catch(() => "error"),
  ]);
  let storage: "ok" | "error" = "error";
  try {
    storage = await storageHealth();
  } catch {
    storage = "error";
  }
  const match = await prisma.match.findFirst({
    where: { status: { in: ["SPRINT", "PITCH", "SCORING", "READY"] } },
    include: { competitorA: true, competitorB: true, round: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">Vận hành kỹ thuật</h1>
      {competition?.isRehearsal ? (
        <p className="text-amber-700">Đang ở competition rehearsal</p>
      ) : (
        <p>Chế độ: Production</p>
      )}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>DB: {String(dbOk)}</Card>
        <Card>
          Storage: {storage}
          {storage === "error" ? (
            <p className="mt-1 text-xs text-slate-500">MinIO/S3 chưa kết nối được. Local chưa bắt buộc nếu chỉ dùng URL video.</p>
          ) : null}
        </Card>
        <Card>Email lỗi: {emailFail}</Card>
        <Card>Sự cố mở: {incidents}</Card>
      </div>
      {match ? (
        <Card>
          <p className="font-semibold">
            Trận hiện tại: {match.round.displayName} · {match.code}
          </p>
          <p className="text-sm text-slate-600">
            {match.competitorA?.displayName ?? "TBD"} vs {match.competitorB?.displayName ?? "TBD"} · {match.status}
          </p>
          <p className="mt-2 text-sm">
            <Link href={`/admin/bracket/${match.id}`} className="underline">
              Mở chi tiết trận
            </Link>
          </p>
          <form action={timerAction} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="kind" value="SPRINT" />
            <Button name="action" value="start">
              Start timer
            </Button>
            <Button name="action" value="pause" variant="outline">
              Pause
            </Button>
            <Button name="action" value="resume" variant="outline">
              Resume
            </Button>
          </form>
        </Card>
      ) : (
        <Card>Chưa có trận ở trạng thái READY / SPRINT / PITCH / SCORING.</Card>
      )}
    </div>
  );
}
