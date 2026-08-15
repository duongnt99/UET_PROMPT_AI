import { Card } from "@/components/ui/form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kết quả" };
export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl">Kết quả</h1>
      <Card className="mt-6">Kết quả chỉ hiển thị sau khi Ban Tổ chức công bố. Hiện đang cập nhật.</Card>
    </div>
  );
}
