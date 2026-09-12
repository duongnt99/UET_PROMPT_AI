import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/auth-forms";
import { auth } from "@/lib/auth";
import { resolvePostLoginPath } from "@/server/domain/permissions";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Đăng nhập" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; registered?: string; reset?: string }>;
}) {
  const { from, registered, reset } = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(resolvePostLoginPath(from, session.user.roles));
  }
  return (
    <div className="px-4 py-16">
      <LoginForm from={from} registered={registered === "1"} reset={reset === "1"} />
    </div>
  );
}
