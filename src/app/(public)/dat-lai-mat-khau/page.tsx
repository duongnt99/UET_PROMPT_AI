import { ResetForm } from "@/components/forms/auth-forms";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="px-4 py-16">
      <ResetForm token={token ?? ""} />
    </div>
  );
}
