import { verifyEmailAction } from "@/server/actions/auth-actions";
import { Card } from "@/components/ui/form";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Xác minh email" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false, message: "Thiếu mã xác minh." };
  return (
    <div className="px-4 py-16">
      <Card className="mx-auto max-w-md">
        <h1 className="display text-2xl">Xác minh email</h1>
        <p className="mt-4">{result.ok ? "Email đã được xác minh. Bạn có thể đăng nhập." : result.message}</p>
        <Link href="/dang-nhap" className="mt-4 inline-block underline">Đăng nhập</Link>
      </Card>
    </div>
  );
}
