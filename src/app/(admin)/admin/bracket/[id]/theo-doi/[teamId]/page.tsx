import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { AdminScreenMonitor } from "@/components/live/admin-screen-monitor";
import { validateViewerAccess } from "@/server/services/live-screen-service";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const user = await requirePermission("operations:control");
  const { id, teamId: registrationId } = await params;
  const { match, registration, competitorName } = await validateViewerAccess({
    roles: user.roles,
    contestSessionId: id,
    registrationId,
  });
  const notes = await prisma.internalNote.findMany({
    where: { registrationId: registration.id, contestSessionId: id },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div className="space-y-5">
      <p className="text-sm">
        <Link href={`/admin/bracket/${match.id}`} className="text-slate-600 underline">← Trở lại trận {match.code}</Link>
      </p>
      <AdminScreenMonitor
        contestSessionId={match.id}
        registrationId={registration.id}
        competitorName={competitorName}
        initialComments={notes.map((note) => ({
          id: note.id,
          content: note.body,
          authorName: note.author.name || note.author.email,
          createdAt: note.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
