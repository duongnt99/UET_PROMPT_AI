import { getPublicHomeData } from "@/server/services/content-service";
import { Badge, Card } from "@/components/ui/form";
import { formatDateTime } from "@/lib/dates";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lịch trình" };

export default async function Page() {
  const data = await getPublicHomeData();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="display text-4xl">Lịch trình</h1>
      <p className="mt-2 text-slate-600">Các mốc chưa chốt được gắn nhãn Dự kiến.</p>
      <div className="mt-8 space-y-4">
        {(data?.timeline ?? []).map((item) => (
          <Card key={item.id}>
            <Badge tone="gold">{item.statusLabel}</Badge>
            <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
            <p className="mt-1 text-slate-600">{item.description}</p>
            {item.startAt ? <p className="mt-2 text-sm text-slate-500">{formatDateTime(item.startAt)}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
