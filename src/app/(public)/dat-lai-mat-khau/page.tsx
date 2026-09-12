import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/form";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  if (!token) {
    return (
      <div className="px-4 py-16">
        <Card className="mx-auto max-w-md">
          <h1 className="display text-2xl">Đặt lại mật khẩu</h1>
          <p className="mt-4 text-sm text-slate-700">
            Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu liên kết mới.
          </p>
          <p className="mt-4 text-sm">
            <Link href="/quen-mat-khau" className="underline">Yêu cầu đặt lại mật khẩu</Link>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-16">
      <ResetPasswordForm token={token} />
    </div>
  );
}
