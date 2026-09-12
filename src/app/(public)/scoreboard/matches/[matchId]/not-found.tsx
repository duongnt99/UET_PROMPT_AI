import Link from "next/link";
import { Card } from "@/components/ui/form";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Card>
        <h1 className="display text-2xl">Không tìm thấy trận đấu</h1>
        <p className="mt-3 text-slate-600">Trận đấu không tồn tại hoặc chưa được công bố.</p>
        <Link href="/scoreboard" className="mt-6 inline-block font-semibold text-blue-700 underline">
          ← Quay lại Bảng đấu trực tiếp
        </Link>
      </Card>
    </div>
  );
}
