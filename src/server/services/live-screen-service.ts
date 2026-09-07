import { Prisma, type Role, type ScreenShareStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { parseCompetitionSettings } from "@/config/competition-settings";
import {
  assertCanPublishLiveScreen,
  assertCanWatchLiveScreen,
  assertRegistrationBelongsToContestSession,
  chooseAvailableScreenSlot,
  isLiveScreenMatchStatus,
} from "@/server/domain/live-screen";
import type { Role as AppRole } from "@/server/domain/permissions";

const ACTIVE_STATUSES: ScreenShareStatus[] = ["CONNECTING", "ACTIVE", "RECONNECTING"];
const STALE_AFTER_MS = 30_000;

async function getContestSession(contestSessionId: string) {
  const match = await prisma.match.findUnique({
    where: { id: contestSessionId },
    include: {
      competition: true,
      competitorA: { include: { registration: { select: { id: true } } } },
      competitorB: { include: { registration: { select: { id: true } } } },
    },
  });
  if (!match) throw new Error("Không tìm thấy phiên thi.");
  return match;
}

function registrationIdsForMatch(match: Awaited<ReturnType<typeof getContestSession>>) {
  return [match.competitorA?.registration.id, match.competitorB?.registration.id].filter(
    (registrationId): registrationId is string => Boolean(registrationId),
  );
}

async function findCompetitorRegistration(match: Awaited<ReturnType<typeof getContestSession>>, userId: string) {
  return prisma.registration.findFirst({
    where: {
      id: { in: registrationIdsForMatch(match) },
      deletedAt: null,
      OR: [
        { type: "INDIVIDUAL", ownerUserId: userId },
        {
          type: "TEAM",
          team: {
            deletedAt: null,
            OR: [
              { leaderUserId: userId },
              { members: { some: { userId, status: "ACCEPTED" } } },
            ],
          },
        },
      ],
    },
    include: { team: true, owner: { include: { profile: true } } },
  });
}

function registrationDisplayName(registration: NonNullable<Awaited<ReturnType<typeof findCompetitorRegistration>>>) {
  return registration.team?.teamName
    || registration.owner.profile?.fullName
    || registration.owner.name
    || registration.owner.email;
}

const overlayCompetitorInclude = {
  registration: {
    include: {
      owner: { include: { profile: true } },
      team: {
        include: {
          members: {
            where: { status: "ACCEPTED" as const },
            include: { user: { include: { profile: true } } },
            orderBy: { createdAt: "asc" as const },
          },
        },
      },
    },
  },
} as const;

function participantName(user: { name: string | null; email: string; profile: { fullName: string } | null }) {
  return user.profile?.fullName || user.name || user.email;
}

export async function getCurrentMatchDualScreenContext() {
  const competition = await prisma.competition.findFirst({
    where: { isRehearsal: false, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!competition) return null;
  const currentMatchId = parseCompetitionSettings(competition.settings).currentMatchId;
  if (!currentMatchId) return null;
  const match = await prisma.match.findFirst({
    where: { id: currentMatchId, competitionId: competition.id },
    include: {
      competitorA: { include: overlayCompetitorInclude },
      competitorB: { include: overlayCompetitorInclude },
    },
  });
  if (!match?.competitorA || !match.competitorB) return null;

  function side(label: "A" | "B", competitor: NonNullable<NonNullable<typeof match>["competitorA"]>) {
    const registration = competitor.registration;
    const preferredParticipant = registration.team
      ? registration.team.members.find((member) => member.userId === registration.team?.leaderUserId)?.user
        ?? registration.team.members[0]?.user
        ?? registration.owner
      : registration.owner;
    return {
      side: label,
      registrationId: registration.id,
      competitorName: competitor.displayName,
      preferredParticipantId: preferredParticipant.id,
      preferredParticipantName: participantName(preferredParticipant),
    };
  }

  return {
    contestSessionId: match.id,
    sides: [side("A", match.competitorA), side("B", match.competitorB)] as const,
  };
}

export async function getParticipantLiveScreenContext(userId: string) {
  const competitions = await prisma.competition.findMany({
    where: { isRehearsal: false, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  for (const competition of competitions) {
    const settings = parseCompetitionSettings(competition.settings);
    if (!settings.currentMatchId) continue;
    const match = await getContestSession(settings.currentMatchId);
    if (match.competitionId !== competition.id) continue;
    const registration = await findCompetitorRegistration(match, userId);
    if (!registration) continue;
    return {
      contestSessionId: match.id,
      matchCode: match.code,
      matchStatus: match.status,
      registrationId: registration.id,
      competitorName: registrationDisplayName(registration),
      registrationType: registration.type,
      problemTitle: match.problemTitle,
      problemPrompt: match.problemPrompt,
      canShare: isLiveScreenMatchStatus(match.status),
    };
  }
  return null;
}

export async function validatePublisherAccess(params: {
  userId: string;
  contestSessionId: string;
  requestedParticipantId?: string;
}) {
  const match = await getContestSession(params.contestSessionId);
  const settings = parseCompetitionSettings(match.competition.settings);
  const registration = await findCompetitorRegistration(match, params.userId);
  assertCanPublishLiveScreen({
    authenticatedUserId: params.userId,
    requestedParticipantId: params.requestedParticipantId,
    isEligibleCompetitor: Boolean(registration),
    isCurrentContestSession: settings.currentMatchId === match.id,
    matchStatus: match.status,
  });
  return { match, registration: registration! };
}

export async function validateViewerAccess(params: {
  roles: AppRole[];
  contestSessionId: string;
  registrationId: string;
}) {
  assertCanWatchLiveScreen(params.roles);
  const match = await getContestSession(params.contestSessionId);
  const registration = await prisma.registration.findFirst({
    where: {
      OR: [
        { id: params.registrationId },
        { teamId: params.registrationId },
      ],
    },
    include: { team: true, owner: { include: { profile: true } } },
  });
  if (!registration) throw new Error("Không tìm thấy hồ sơ dự thi.");
  assertRegistrationBelongsToContestSession({
    requestedRegistrationId: registration.id,
    competitorRegistrationIds: registrationIdsForMatch(match),
  });
  return { match, registration, competitorName: registrationDisplayName(registration) };
}

export async function acquirePublisherSlot(params: {
  userId: string;
  contestSessionId: string;
  connectionId: string;
  resumeSessionId?: string;
}) {
  const { match, registration } = await validatePublisherAccess({
    userId: params.userId,
    contestSessionId: params.contestSessionId,
  });
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_AFTER_MS);
  const session = await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${match.id}), hashtext(${registration.id}))`;
      await tx.screenShareSession.updateMany({
        where: {
          contestSessionId: match.id,
          registrationId: registration.id,
          endedAt: null,
          lastSeenAt: { lt: staleBefore },
        },
        data: { status: "DISCONNECTED", endedAt: now },
      });

      if (params.resumeSessionId) {
        const resumable = await tx.screenShareSession.findFirst({
          where: {
            id: params.resumeSessionId,
            contestSessionId: match.id,
            registrationId: registration.id,
            participantId: params.userId,
            endedAt: null,
            status: { in: ACTIVE_STATUSES },
          },
        });
        if (resumable) {
          return tx.screenShareSession.update({
            where: { id: resumable.id },
            data: { connectionId: params.connectionId, status: "CONNECTING", lastSeenAt: now },
          });
        }
      }

      const existing = await tx.screenShareSession.findFirst({
        where: {
          contestSessionId: match.id,
          registrationId: registration.id,
          participantId: params.userId,
          endedAt: null,
          status: { in: ACTIVE_STATUSES },
        },
      });
      if (existing) {
        return tx.screenShareSession.update({
          where: { id: existing.id },
          data: { connectionId: params.connectionId, status: "CONNECTING", lastSeenAt: now },
        });
      }

      const active = await tx.screenShareSession.findMany({
        where: {
          contestSessionId: match.id,
          registrationId: registration.id,
          endedAt: null,
          status: { in: ACTIVE_STATUSES },
        },
        select: { slot: true },
      });
      const slot = chooseAvailableScreenSlot(active.map((item) => item.slot));
      return tx.screenShareSession.create({
        data: {
          contestSessionId: match.id,
          competitionId: match.competitionId,
          registrationId: registration.id,
          teamId: registration.teamId,
          participantId: params.userId,
          slot,
          connectionId: params.connectionId,
          status: "CONNECTING",
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  const participant = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { profile: true },
  });
  return {
    ...session,
    participantName: participant?.profile?.fullName || participant?.name || participant?.email || "Thành viên",
  };
}

export async function setPublisherStatus(sessionId: string, connectionId: string, status: ScreenShareStatus) {
  return prisma.screenShareSession.updateMany({
    where: { id: sessionId, connectionId, endedAt: null },
    data: { status, lastSeenAt: new Date() },
  });
}

export async function touchPublisherSession(sessionId: string, connectionId: string) {
  return prisma.screenShareSession.updateMany({
    where: { id: sessionId, connectionId, endedAt: null },
    data: { lastSeenAt: new Date() },
  });
}

export async function endPublisherSession(
  sessionId: string,
  connectionId: string,
  status: Extract<ScreenShareStatus, "STOPPED" | "DISCONNECTED">,
) {
  return prisma.screenShareSession.updateMany({
    where: { id: sessionId, connectionId, endedAt: null },
    data: { status, endedAt: new Date(), lastSeenAt: new Date() },
  });
}

export async function listLivePublisherSessions(contestSessionId: string, registrationId: string) {
  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  await prisma.screenShareSession.updateMany({
    where: { contestSessionId, registrationId, endedAt: null, lastSeenAt: { lt: staleBefore } },
    data: { status: "DISCONNECTED", endedAt: new Date() },
  });
  return prisma.screenShareSession.findMany({
    where: { contestSessionId, registrationId, endedAt: null, status: { in: ACTIVE_STATUSES } },
    include: { participant: { include: { profile: true } } },
    orderBy: { slot: "asc" },
  });
}

export function databaseRolesToAppRoles(roles: Role[]): AppRole[] {
  return roles as AppRole[];
}
