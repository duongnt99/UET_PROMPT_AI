import { PublicFooter, PublicHeader } from "@/components/public/site-chrome";
import { auth } from "@/lib/auth";
import { homePathForRoles } from "@/server/domain/permissions";
import { getProductionCompetition } from "@/server/services/competition-service";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [session, competition] = await Promise.all([auth(), getProductionCompetition()]);
  const brandName = competition
    ? `${competition.settings.landingHeroTitle} ${competition.settings.landingHeroHighlight}`.replace(/\s+/g, " ").trim()
    : "AI Arena Vietnam";
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader workspaceHref={session?.user ? homePathForRoles(session.user.roles) : null} brandName={brandName} />
      <main className="flex-1">{children}</main>
      <PublicFooter brandName={brandName} />
    </div>
  );
}
