import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/form";
import { ResendVerificationForm } from "@/components/forms/resend-verification-form";
import { verifyEmailWithToken } from "@/server/services/auth-token-service";

export const metadata: Metadata = { title: "Xác minh email" };

type PageProps = {
  searchParams: Promise<{ token?: string; sent?: string; email?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaultEmail = params.email ? decodeURIComponent(params.email) : "";

  if (params.token) {
    const result = await verifyEmailWithToken(params.token);
    return (
      <div className="px-4 py-16">
        <Card className="mx-auto max-w-md">
          <h1 className="display text-2xl">Xác minh email</h1>
          {result.ok ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {result.alreadyVerified
                ? "Email của bạn đã được xác minh trước đó."
                : "Xác minh email thành công. Bạn có thể đăng nhập ngay."}
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {result.message}
            </p>
          )}
          <p className="mt-4 text-sm">
            <Link href="/dang-nhap" className="underline">Đi tới trang đăng nhập</Link>
          </p>
          {!result.ok ? <ResendVerificationForm defaultEmail={defaultEmail} /> : null}
        </Card>
      </div>
    );
  }

  const emailSent = params.sent === "1";

  return (
    <div className="px-4 py-16">
      <Card className="mx-auto max-w-md">
        <h1 className="display text-2xl">Xác minh email</h1>
        {emailSent ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Đăng ký thành công. Chúng tôi đã gửi email xác minh
            {defaultEmail ? ` tới ${defaultEmail}` : ""}. Vui lòng mở liên kết trong email để kích hoạt tài khoản.
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Đăng ký thành công nhưng hệ thống chưa gửi được email xác minh. Vui lòng thử gửi lại bên dưới.
          </p>
        )}
        <ResendVerificationForm defaultEmail={defaultEmail} />
      </Card>
    </div>
  );
}
