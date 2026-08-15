import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
export default async function Page() {
  const items = await prisma.incident.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="display text-3xl">Nhật ký sự cố</h1>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? <p>Chưa có sự cố.</p> : null}
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex justify-between">
              <p className="font-semibold">{item.title}</p>
              <Badge>{item.severity}</Badge>
            </div>
            <p className="text-sm">{item.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
