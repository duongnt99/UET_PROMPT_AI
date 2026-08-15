import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";
import { Card } from "@/components/ui/form";
import { formatDateTime } from "@/lib/dates";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tin tức" };

export default async function Page() {
  const competition = await getProductionCompetition();
  const items = competition
    ? await prisma.announcement.findMany({
        where: { competitionId: competition.id, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      })
    : [];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="display text-4xl">Tin tức</h1>
      <div className="mt-8 space-y-4">
        {items.length === 0 ? <p>Chưa có thông báo.</p> : null}
        {items.map((item) => (
          <Link key={item.id} href={`/tin-tuc/${item.slug}`}>
            <Card>
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.excerpt}</p>
              <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.publishedAt)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
