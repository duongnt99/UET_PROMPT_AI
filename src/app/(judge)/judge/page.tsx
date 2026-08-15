import { requireAnyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page() {
  const user = await requireAnyRole(["JUDGE", "ADMIN", "SUPER_ADMIN"]);
  const assignments = await prisma.judgeAssignment.findMany({
    where: user.roles.includes("JUDGE") ? { judgeId: user.id } : {},
    include: { match: { include: { competitorA: true, competitorB: true, round: true } } },
  });
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="display text-3xl">Giám khảo</h1>
      <div className="mt-4 space-y-3">
        {assignments.map((item) => (
          <Link key={item.id} href={`/judge/matches/${item.matchId}`}>
            <Card className="flex justify-between gap-3">
              <span>
                {item.match.code}: {item.match.competitorA?.displayName} vs {item.match.competitorB?.displayName}
              </span>
              <span className="flex gap-2">
                <Badge tone={item.status === "SUBMITTED" ? "green" : "gold"}>
                  {item.status === "SUBMITTED" ? "Đã nộp phiếu" : "Chưa nộp"}
                </Badge>
                <Badge>{item.match.status}</Badge>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
