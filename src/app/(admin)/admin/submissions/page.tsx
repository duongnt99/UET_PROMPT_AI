import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import Link from "next/link";

export default async function Page() {
  const items = await     prisma.submission.findMany({
    where: { deletedAt: null },
    include: { registration: true, currentVersion: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-3xl">Bài Audition</h1>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link key={item.id} href={`/admin/submissions/${item.id}`}>
            <Card className="flex justify-between">
              <div>
                <p className="font-semibold">{item.currentVersion?.submissionTitle || "Chưa có tiêu đề"}</p>
                <p className="text-sm text-slate-600">{item.registration.code}</p>
              </div>
              <Badge>{item.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
