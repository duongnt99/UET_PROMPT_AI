import { requireUser } from "@/lib/auth/guards";
import { DashboardNav } from "@/components/dashboard/nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard thí sinh",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <DashboardNav email={user.email} roles={user.roles} />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
