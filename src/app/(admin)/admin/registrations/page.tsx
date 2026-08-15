import { prisma } from "@/lib/db/prisma";
import { pagination } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/form";
import Link from "next/link";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const { skip, take } = pagination(Number(page ?? 1), 20);
  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" as const } },
            { owner: { email: { contains: q, mode: "insensitive" as const } } },
            { team: { teamName: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { owner: { include: { profile: true } }, team: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.registration.count({ where }),
  ]);
  return (
    <div>
      <h1 className="display text-3xl">Hồ sơ đăng ký</h1>
      <form className="mt-4">
        <input name="q" defaultValue={q} placeholder="Tìm mã, email, đội" className="h-11 rounded-xl border px-3" />
      </form>
      <p className="mt-2 text-sm text-slate-500">{total} hồ sơ</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link key={item.id} href={`/admin/registrations/${item.id}`}>
            <Card className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{item.code}</p>
                <p className="text-sm text-slate-600">
                  {item.owner.profile?.fullName} · {item.owner.email} · {item.team?.teamName ?? "Cá nhân"}
                </p>
              </div>
              <Badge>{item.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
