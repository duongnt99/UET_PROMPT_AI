import { prisma } from "@/lib/db/prisma";
import { storageHealth } from "@/lib/storage";
import { Card } from "@/components/ui/form";
import { timerAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { getProductionCompetition } from "@/server/services/competition-service";
import { requirePermission } from "@/lib/auth/guards";
import Link from "next/link";
import { matchStatusLabel } from "@/lib/status-labels";

export default async function Page() {
  await requirePermission("operations:control");
  const competition = await getProductionCompetition();
  const [notifications, incidents, dbOk] = await Promise.all([
    prisma.notification.count(),
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
        <p className="text-amber-700">Đang ở cuộc thi diễn tập</p>
      ) : (
        <p>Chế độ: Cuộc thi chính thức</p>
      )}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>Cơ sở dữ liệu: {dbOk === "ok" ? "Hoạt động" : "Lỗi"}</Card>
        <Card>
          Kho tệp: {storage === "ok" ? "Hoạt động" : "Lỗi"}
          {storage === "error" ? (
            <p className="mt-1 text-xs text-slate-500">MinIO/S3 chưa kết nối được. Local chưa bắt buộc nếu chỉ dùng URL video.</p>
          ) : null}
        </Card>
        <Card>Thông báo nội bộ: {notifications}</Card>
        <Card>Sự cố mở: {incidents}</Card>
      </div>
      {match ? (
        <Card>
          <p className="font-semibold">
            Trận hiện tại: {match.round.displayName} · {match.code}
          </p>
          <p className="text-sm text-slate-600">
            {match.competitorA?.displayName ?? "Chưa xác định"} gặp {match.competitorB?.displayName ?? "Chưa xác định"} · {matchStatusLabel(match.status)}
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
              Bắt đầu đồng hồ
            </Button>
            <Button name="action" value="pause" variant="outline">
              Tạm dừng
            </Button>
            <Button name="action" value="resume" variant="outline">
              Tiếp tục
            </Button>
          </form>
        </Card>
      ) : (
        <Card>Chưa có trận đang sẵn sàng, thi thực hành, thuyết trình hoặc chấm điểm.</Card>
      )}
    </div>
  );
}
