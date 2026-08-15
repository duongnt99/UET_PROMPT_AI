import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";
import { Card } from "@/components/ui/form";

export default async function Page() {
  const competition = await getProductionCompetition();
  const [users, verified, registrations, submissions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.registration.groupBy({ by: ["status"], _count: true }),
    prisma.submission.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <div>
      <h1 className="display text-3xl">Bảng điều khiển</h1>
      <p className="mt-1 text-sm text-slate-600">{competition?.name} {competition?.isRehearsal ? "(Rehearsal)" : ""}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card>Tài khoản: {users}</Card>
        <Card>Đã xác minh email: {verified}</Card>
        <Card>Hồ sơ: {registrations.reduce((s, i) => s + i._count, 0)}</Card>
        <Card>Bài nộp: {submissions.reduce((s, i) => s + i._count, 0)}</Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Đăng ký theo trạng thái</h2>
          <ul className="mt-2 text-sm">
            {registrations.map((row) => (
              <li key={row.status}>
                {row.status}: {row._count}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Submission theo trạng thái</h2>
          <ul className="mt-2 text-sm">
            {submissions.map((row) => (
              <li key={row.status}>
                {row.status}: {row._count}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
