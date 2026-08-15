import { prisma } from "@/lib/db/prisma";
import {
  defaultCompetitionSettings,
  parseCompetitionSettings,
  type CompetitionSettings,
} from "@/config/competition-settings";
import { writeAuditLog } from "@/lib/audit";

export async function getProductionCompetition() {
  const competition = await prisma.competition.findFirst({
    where: { isRehearsal: false, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!competition) return null;
  return {
    ...competition,
    settings: parseCompetitionSettings(competition.settings),
  };
}

export async function getCompetitionById(id: string) {
  const competition = await prisma.competition.findUnique({ where: { id } });
  if (!competition) return null;
  return {
    ...competition,
    settings: parseCompetitionSettings(competition.settings),
  };
}

export async function requireProductionCompetition() {
  const competition = await getProductionCompetition();
  if (!competition) {
    throw new Error("Production competition is not seeded");
  }
  return competition;
}

export async function updateCompetitionSettings(params: {
  competitionId: string;
  actorUserId: string;
  settings: CompetitionSettings;
  reason?: string;
}) {
  const current = await prisma.competition.findUniqueOrThrow({
    where: { id: params.competitionId },
  });
  const next = parseCompetitionSettings(params.settings);
  const updated = await prisma.competition.update({
    where: { id: params.competitionId, version: current.version },
    data: {
      name: next.competitionName,
      slug: next.competitionSlug,
      season: next.season,
      maintenanceMode: next.maintenanceMode,
      settings: next,
      version: { increment: 1 },
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: params.competitionId,
    action: "settings.update",
    entityType: "Competition",
    entityId: params.competitionId,
    before: current.settings as object,
    after: next,
    reason: params.reason ?? null,
  });
  return updated;
}

export function publicLabel(status: "TENTATIVE" | "CONFIRMED", value: string | null | undefined) {
  if (!value) return "Đang cập nhật";
  return status === "TENTATIVE" ? `Dự kiến: ${value}` : value;
}

export { defaultCompetitionSettings };
