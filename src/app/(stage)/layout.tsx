import { requireAnyRole } from "@/lib/auth/guards";
import { StageLogoutButton } from "@/components/workspace/session-bar";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAnyRole(["ADMIN", "SUPER_ADMIN", "TECH_OPERATOR"]);
  return (
    <div className="relative min-h-screen">
      <StageLogoutButton />
      {children}
    </div>
  );
}
