import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/form";
import { formatDateTime } from "@/lib/dates";
import Link from "next/link";
import { getPendingTeamInvitations } from "@/server/services/registration-service";

export default async function Page() {
  const user = await requireUser();
  const [items, teamInvitations] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, NOT: { id: { startsWith: "team-invitation:" } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getPendingTeamInvitations(user.id),
  ]);
  return (
    <div>
      <h1 className="display text-3xl">Thông báo</h1>
      <div className="mt-6 space-y-3">
        {items.length === 0 && teamInvitations.length === 0 ? <p>Chưa có thông báo.</p> : null}
        {teamInvitations.map((invitation) => (
          <Card key={`invitation-${invitation.id}`}>
            <h2 className="font-semibold">Lời mời tham gia đội</h2>
            <p className="text-sm text-slate-600">Bạn được mời tham gia đội {invitation.team.teamName}.</p>
            <Link href="/dashboard/doi-thi" className="mt-2 inline-block text-sm font-medium underline">
              Xem và phản hồi
            </Link>
          </Card>
        ))}
        {items.map((item) => (
          <Card key={item.id}>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm text-slate-600">{item.body}</p>
            {item.href ? <Link href={item.href} className="mt-2 inline-block text-sm underline">Xem chi tiết</Link> : null}
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
