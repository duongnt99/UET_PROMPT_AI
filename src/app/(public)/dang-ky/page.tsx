import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth-forms";
import { auth } from "@/lib/auth";
import { homePathForRoles } from "@/server/domain/permissions";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Đăng ký" };
export default async function Page() {
  const session = await auth();
  if (session?.user) {
    redirect(homePathForRoles(session.user.roles));
  }
  return (
    <div className="px-4 py-16">
      <RegisterForm />
    </div>
  );
}
