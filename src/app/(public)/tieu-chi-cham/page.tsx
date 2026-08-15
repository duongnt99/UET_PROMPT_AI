import { getPublicHomeData } from "@/server/services/content-service";
import { Card } from "@/components/ui/form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tiêu chí chấm" };
export default async function Page() {
  const data = await getPublicHomeData();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="display text-4xl">Tiêu chí chấm</h1>
      <p className="mt-2 text-slate-600">Trọng số lấy từ rubric đang kích hoạt.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(data?.rubric?.criteria ?? []).map((criterion) => (
          <Card key={criterion.id}>
            <p className="text-sm text-amber-700">{criterion.weight.toString()}%</p>
            <h2 className="text-xl font-semibold">{criterion.titleVi}</h2>
            <p className="mt-2 text-sm text-slate-600">{criterion.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
