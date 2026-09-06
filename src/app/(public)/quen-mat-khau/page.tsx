import { Card } from "@/components/ui/form";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Quên mật khẩu" };
export default function Page() {
  return (
    <div className="px-4 py-16">
      <Card className="mx-auto max-w-md">
        <h1 className="display text-2xl">Quên mật khẩu</h1>
        <p className="mt-4 text-sm text-slate-700">
          Hệ thống không gửi email tự động. Vui lòng liên hệ Ban Tổ chức và cung cấp email đăng nhập để được đặt lại mật khẩu.
        </p>
        <Link href="/dang-nhap" className="mt-4 inline-block underline">Quay lại đăng nhập</Link>
      </Card>
    </div>
  );
}
