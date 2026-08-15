import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { auth } from "@/lib/auth";
import { homePathForRoles } from "@/server/domain/permissions";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader workspaceHref={session?.user ? homePathForRoles(session.user.roles) : null} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
