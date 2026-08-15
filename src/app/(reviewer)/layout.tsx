import { requireAnyRole } from "@/lib/auth/guards";
import { WorkspaceSessionBar } from "@/components/workspace/session-bar";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireAnyRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);
  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceSessionBar title="Reviewer" email={user.email} homeHref="/reviewer" />
      {children}
    </div>
  );
}
