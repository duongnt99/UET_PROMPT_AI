import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";

export default async function Page() {
  await requirePermission("bracket:manage");
  const competition = await getProductionCompetition();
  const items = competition
    ? await prisma.matchChallenge.findMany({
        where: { competitionId: competition.id },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { matches: true } } },
      })
    : [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Kho đề thi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Đề dùng chung cho cả hai đội trong một trận. Gán đề trên trang bracket của cặp đấu.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/challenges/new">Tạo đề thi</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-600">Chưa có đề. Bấm Tạo đề thi.</p> : null}
        {items.map((item) => (
          <Link key={item.id} href={`/admin/challenges/${item.id}`}>
            <Card className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-slate-600">Đang gán cho {item._count.matches} trận</p>
              </div>
              <Badge>{item._count.matches} trận</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
