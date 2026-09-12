import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductionCompetition } from "@/server/services/competition-service";
import { normalizeAuditReason, normalizeChallengeNotes } from "@/config/field-limits";
import { matchProblemForDisplay, normalizeMatchProblem } from "@/server/domain/match-problem";

export async function listMatchChallenges(competitionId: string) {
  return prisma.matchChallenge.findMany({
    where: { competitionId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { matches: true } } },
  });
}

export async function saveMatchChallenge(params: {
  actorUserId: string;
  id?: string;
  title: string;
  prompt: string;
  notes?: string;
}) {
  const competition = await requireProductionCompetition();
  const problem = normalizeMatchProblem({ title: params.title, prompt: params.prompt });
  const notes = params.notes?.trim() ?? "";
  const challenge = params.id
    ? await (async () => {
        const existing = await prisma.matchChallenge.findFirst({
          where: { id: params.id, competitionId: competition.id },
        });
        if (!existing) throw new Error("Không tìm thấy đề thi.");
        const updated = await prisma.matchChallenge.update({
          where: { id: existing.id },
          data: { title: problem.title, prompt: problem.prompt, notes },
        });
        await prisma.match.updateMany({
          where: { challengeId: existing.id },
          data: {
            problemTitle: problem.title,
            problemPrompt: problem.prompt,
            version: { increment: 1 },
          },
        });
        return updated;
      })()
    : await prisma.matchChallenge.create({
        data: {
          competitionId: competition.id,
          title: problem.title,
          prompt: problem.prompt,
          notes,
        },
      });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: competition.id,
    action: params.id ? "challenge.update" : "challenge.create",
    entityType: "MatchChallenge",
    entityId: challenge.id,
    after: { title: challenge.title },
  });
  return challenge;
}

export async function deleteMatchChallenge(params: { actorUserId: string; id: string; reason: string }) {
  const reason = normalizeAuditReason(params.reason);
  const competition = await requireProductionCompetition();
  const existing = await prisma.matchChallenge.findFirst({
    where: { id: params.id, competitionId: competition.id },
  });
  if (!existing) throw new Error("Không tìm thấy đề thi.");
  await prisma.matchChallenge.delete({ where: { id: existing.id } });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: competition.id,
    action: "challenge.delete",
    entityType: "MatchChallenge",
    entityId: existing.id,
    before: { title: existing.title },
    reason,
  });
  return existing;
}

export async function saveMatchProblem(params: {
  actorUserId: string;
  matchId: string;
  title: string;
  prompt: string;
  saveToLibrary?: boolean;
  reason: string;
}) {
  const reason = normalizeAuditReason(params.reason);
  const problem = normalizeMatchProblem({ title: params.title, prompt: params.prompt });
  const match = await prisma.match.findUniqueOrThrow({ where: { id: params.matchId } });
  let challengeId = match.challengeId;
  if (params.saveToLibrary) {
    const challenge = await prisma.matchChallenge.create({
      data: {
        competitionId: match.competitionId,
        title: problem.title,
        prompt: problem.prompt,
      },
    });
    challengeId = challenge.id;
  }
  const updated = await prisma.match.update({
    where: { id: match.id },
    data: {
      problemTitle: problem.title,
      problemPrompt: problem.prompt,
      challengeId,
      version: { increment: 1 },
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.problem.save",
    entityType: "Match",
    entityId: match.id,
    after: { title: problem.title, challengeId },
    reason,
  });
  return updated;
}

export async function assignChallengeToMatch(params: {
  actorUserId: string;
  matchId: string;
  challengeId: string;
  reason: string;
}) {
  const reason = normalizeAuditReason(params.reason);
  const match = await prisma.match.findUniqueOrThrow({ where: { id: params.matchId } });
  const challenge = await prisma.matchChallenge.findFirst({
    where: { id: params.challengeId, competitionId: match.competitionId },
  });
  if (!challenge) throw new Error("Không tìm thấy đề thi trong kho.");
  const updated = await prisma.match.update({
    where: { id: match.id },
    data: {
      challengeId: challenge.id,
      problemTitle: challenge.title,
      problemPrompt: challenge.prompt,
      version: { increment: 1 },
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.problem.assign",
    entityType: "Match",
    entityId: match.id,
    after: { challengeId: challenge.id, title: challenge.title },
    reason,
  });
  return updated;
}

export async function clearMatchProblem(params: { actorUserId: string; matchId: string; reason: string }) {
  const reason = normalizeAuditReason(params.reason);
  const match = await prisma.match.findUniqueOrThrow({ where: { id: params.matchId } });
  const updated = await prisma.match.update({
    where: { id: match.id },
    data: {
      problemTitle: "",
      problemPrompt: "",
      challengeId: null,
      version: { increment: 1 },
    },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.problem.clear",
    entityType: "Match",
    entityId: match.id,
    before: { title: match.problemTitle },
    reason,
  });
  return updated;
}

export { matchProblemForDisplay };
