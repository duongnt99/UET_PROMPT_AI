import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { rankSubmissions } from "@/server/services/review-service";
import { getActiveRubric } from "@/server/services/review-service";
import { canTransition, REGISTRATION_TRANSITIONS } from "@/server/domain/status-transitions";
import { LIVE_MATCH_STATUSES } from "@/server/domain/match-setup";

type RegistrationLabelSource = {
  code: string;
  type: "TEAM" | "INDIVIDUAL";
  team?: { teamName: string } | null;
  owner?: {
    name: string | null;
    profile?: { fullName: string | null; institution: string | null } | null;
  } | null;
};

export function registrationPublicLabel(registration: RegistrationLabelSource) {
  if (registration.type === "TEAM" && registration.team?.teamName) return registration.team.teamName;
  return registration.owner?.profile?.fullName || registration.owner?.name || registration.code;
}

export function registrationInstitution(registration: RegistrationLabelSource) {
  return registration.owner?.profile?.institution ?? null;
}

const registrationLabelInclude = {
  team: true,
  owner: { include: { profile: true } },
} as const;

export async function upsertFinalistFromRegistration(params: {
  registrationId: string;
  overrideReason?: string | null;
  published?: boolean;
}) {
  const registration = await prisma.registration.findUniqueOrThrow({
    where: { id: params.registrationId },
    include: registrationLabelInclude,
  });
  const nextSeed = await prisma.finalist.count({ where: { competitionId: registration.competitionId } });
  return prisma.finalist.upsert({
    where: { registrationId: registration.id },
    update: {
      displayName: registrationPublicLabel(registration),
      institutionPublic: registrationInstitution(registration),
      overrideReason: params.overrideReason ?? undefined,
      ...(params.published === undefined
        ? {}
        : {
            published: params.published,
            publishedAt: params.published ? new Date() : null,
          }),
    },
    create: {
      competitionId: registration.competitionId,
      registrationId: registration.id,
      seed: nextSeed + 1,
      displayName: registrationPublicLabel(registration),
      institutionPublic: registrationInstitution(registration),
      published: params.published ?? false,
      overrideReason: params.overrideReason,
    },
  });
}

export async function lockSelection(params: {
  actorUserId: string;
  competitionId: string;
  registrationIds: string[];
  overrideReason?: string;
}) {
  const ids = [...new Set(params.registrationIds.map((id) => id.trim()).filter(Boolean))];
  if (!ids.length) throw new Error("Chọn ít nhất một hồ sơ để đưa vào chung kết.");
  const ranking = await rankSubmissions(params.competitionId);
  const rubric = await getActiveRubric(params.competitionId, "AUDITION");
  if (!rubric) throw new Error("Chưa có rubric vòng Audition — không khóa được danh sách.");

  const snapshot = await prisma.selectionSnapshot.create({
    data: {
      competitionId: params.competitionId,
      rubricId: rubric.id,
      payload: { ranking, selected: ids, overrideReason: params.overrideReason ?? null },
      lockedAt: new Date(),
      lockedById: params.actorUserId,
    },
  });

  for (const id of ids) {
    const registration = await prisma.registration.findUniqueOrThrow({ where: { id } });
    if (registration.competitionId !== params.competitionId) {
      throw new Error(`Hồ sơ ${registration.code} không thuộc cuộc thi này.`);
    }
    await upsertFinalistFromRegistration({
      registrationId: id,
      overrideReason: params.overrideReason,
    });
    if (registration.status !== "SELECTED") {
      await prisma.registration.update({
        where: { id },
        data: {
          status: "SELECTED",
          version: { increment: 1 },
          statusHistory: {
            create: {
              fromStatus: registration.status,
              toStatus: "SELECTED",
              reason: params.overrideReason || "Khóa danh sách finalist",
              actorUserId: params.actorUserId,
            },
          },
        },
      });
    }
  }

  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: params.competitionId,
    action: "finalist.lock_selection",
    entityType: "SelectionSnapshot",
    entityId: snapshot.id,
    reason: params.overrideReason,
    after: { registrationIds: ids },
  });
  return snapshot;
}

export async function unselectFinalist(params: {
  actorUserId: string;
  finalistId: string;
  reason: string;
}) {
  const reason = params.reason.trim();
  if (reason.length < 3) throw new Error("Cần ghi lý do khi bỏ finalist.");
  const finalist = await prisma.finalist.findUniqueOrThrow({
    where: { id: params.finalistId },
    include: { registration: true },
  });
  const liveMatch = await prisma.match.findFirst({
    where: {
      status: { in: [...LIVE_MATCH_STATUSES] },
      OR: [{ competitorAId: finalist.id }, { competitorBId: finalist.id }],
    },
    select: { code: true },
  });
  if (liveMatch) {
    throw new Error(`Đội đang thi trận ${liveMatch.code}. Kết thúc hoặc hủy trận trước khi bỏ finalist.`);
  }
  if (finalist.registration.status === "SELECTED") {
    if (!canTransition(REGISTRATION_TRANSITIONS, "SELECTED", "NOT_SELECTED")) {
      throw new Error("Không chuyển được trạng thái hồ sơ.");
    }
    await prisma.registration.update({
      where: { id: finalist.registrationId },
      data: {
        status: "NOT_SELECTED",
        version: { increment: 1 },
        statusHistory: {
          create: {
            fromStatus: "SELECTED",
            toStatus: "NOT_SELECTED",
            reason,
            actorUserId: params.actorUserId,
          },
        },
      },
    });
  }
  await prisma.finalist.update({
    where: { id: finalist.id },
    data: { published: false, publishedAt: null, overrideReason: reason },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: finalist.competitionId,
    action: "finalist.unselect",
    entityType: "Finalist",
    entityId: finalist.id,
    reason,
    before: { registrationStatus: finalist.registration.status, published: finalist.published },
    after: { registrationStatus: "NOT_SELECTED", published: false },
  });
}

export async function setFinalistPublished(params: {
  actorUserId: string;
  finalistId: string;
  published: boolean;
  reason: string;
}) {
  const reason = params.reason.trim();
  if (reason.length < 3) throw new Error("Cần ghi lý do khi đổi công bố finalist.");
  const finalist = await prisma.finalist.findUniqueOrThrow({
    where: { id: params.finalistId },
    include: { registration: true },
  });
  if (params.published && finalist.registration.status !== "SELECTED") {
    throw new Error("Chỉ công bố được finalist đang SELECTED.");
  }
  const publishedAt = params.published ? new Date() : null;
  await prisma.finalist.update({
    where: { id: finalist.id },
    data: { published: params.published, publishedAt },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: finalist.competitionId,
    action: params.published ? "finalist.publish_one" : "finalist.unpublish_one",
    entityType: "Finalist",
    entityId: finalist.id,
    reason,
  });
}

export async function publishFinalists(params: {
  actorUserId: string;
  competitionId: string;
}) {
  const finalists = await prisma.finalist.findMany({
    where: { competitionId: params.competitionId, registration: { status: "SELECTED" } },
  });
  if (!finalists.length) throw new Error("Chưa có finalist ở trạng thái SELECTED để công bố.");
  const publishedAt = new Date();
  await prisma.finalist.updateMany({
    where: { id: { in: finalists.map((item) => item.id) } },
    data: { published: true, publishedAt },
  });
  await prisma.selectionSnapshot.updateMany({
    where: { competitionId: params.competitionId, publishedAt: null },
    data: { publishedAt },
  });
  for (const finalist of finalists) {
    const registration = await prisma.registration.findUniqueOrThrow({
      where: { id: finalist.registrationId },
      include: { owner: true },
    });
    await notifyUser({
      id: `finalist-published:${finalist.id}`,
      userId: registration.ownerUserId,
      title: "Bạn vào vòng chung kết",
      body: "Ban Tổ chức đã công bố danh sách thí sinh/đội vào chung kết.",
      href: "/dashboard",
    });
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: params.competitionId,
    action: "finalist.publish",
    entityType: "Competition",
    entityId: params.competitionId,
  });
}

export async function listPublishedFinalists(competitionId: string) {
  return prisma.finalist.findMany({
    where: { competitionId, published: true, registration: { status: "SELECTED" } },
    orderBy: { seed: "asc" },
    include: {
      registration: {
        include: {
          team: true,
          owner: { include: { profile: true } },
        },
      },
    },
  });
}
