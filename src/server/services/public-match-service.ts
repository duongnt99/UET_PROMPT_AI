import { prisma } from "@/lib/db/prisma";
import { computePublicMatchScores, formatMatchDurationLabel } from "@/server/domain/public-match-scoring";
import { remainingTimerSeconds } from "@/server/domain/timer";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getReconciledTimersForMatch } from "@/server/services/match-service";
import { getActiveRubric } from "@/server/services/review-service";
import { timerKindLabel, timerStatusLabel } from "@/lib/status-labels";
import type { PublicMatchDetail, PublicMatchMember } from "@/types/public-match-detail";

const finalistInclude = {
  registration: {
    include: {
      owner: { include: { profile: true } },
      team: {
        include: {
          members: {
            where: { status: "ACCEPTED" },
            include: { user: { include: { profile: true } } },
          },
        },
      },
    },
  },
} as const;

type FinalistWithRegistration = {
  id: string;
  displayName: string;
  institutionPublic: string | null;
  registration: {
    type: "TEAM" | "INDIVIDUAL";
    owner: { name: string | null; profile: { fullName: string } | null };
    team: {
      members: Array<{
        roleLabel: string | null;
        user: { name: string | null; profile: { fullName: string } | null };
      }>;
    } | null;
  };
};

function memberDisplayName(user: { name: string | null; profile: { fullName: string } | null }): string {
  const full = user.profile?.fullName?.trim();
  if (full) return full;
  const name = user.name?.trim();
  if (name) return name;
  return "Thành viên";
}

function publicMembers(finalist: FinalistWithRegistration): PublicMatchMember[] {
  const { registration } = finalist;
  if (registration.team?.members.length) {
    return registration.team.members.map((member) => ({
      displayName: memberDisplayName(member.user),
      role: member.roleLabel?.trim() || null,
    }));
  }
  return [
    {
      displayName: memberDisplayName(registration.owner),
      role: registration.type === "INDIVIDUAL" ? "Thí sinh" : null,
    },
  ];
}

function mapCompetitor(finalist: FinalistWithRegistration | null) {
  if (!finalist) return null;
  return {
    id: finalist.id,
    displayName: finalist.displayName,
    institutionPublic: finalist.institutionPublic,
    members: publicMembers(finalist),
  };
}

export async function getPublicMatchDetail(matchId: string): Promise<PublicMatchDetail | null> {
  const competition = await getProductionCompetition();
  if (!competition?.settings.publicScoreboardEnabled) return null;

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      competitionId: competition.id,
      publicStatus: { not: "ARCHIVED" },
    },
    include: {
      round: true,
      competitorA: { include: finalistInclude },
      competitorB: { include: finalistInclude },
      winner: true,
      timers: { orderBy: { kind: "asc" } },
      judgeAssignments: {
        include: {
          scores: { include: { items: true } },
        },
      },
    },
  });

  if (!match) return null;

  const now = new Date();
  match.timers = await getReconciledTimersForMatch(match.id, now);

  const durationMs =
    match.actualStartedAt && match.actualEndedAt
      ? match.actualEndedAt.getTime() - match.actualStartedAt.getTime()
      : null;

  const scoresVisible =
    competition.settings.publicScoresEnabled && match.publicStatus === "PUBLISHED";

  let scoresComplete = false;
  let scoreBreakdown: PublicMatchDetail["scoreBreakdown"] = [];
  let totals: PublicMatchDetail["totals"] = null;

  if (scoresVisible) {
    const rubric = await getActiveRubric(match.competitionId, "FINAL");
    const computed = computePublicMatchScores({
      numberOfJudgesPerMatch: competition.settings.numberOfJudgesPerMatch,
      competitorAId: match.competitorAId,
      competitorBId: match.competitorBId,
      criteria: rubric?.criteria.map((criterion) => ({
        id: criterion.id,
        titleVi: criterion.titleVi,
        weight: Number(criterion.weight),
      })) ?? [],
      judgeAssignments: match.judgeAssignments.map((assignment) => ({
        status: assignment.status,
        scores: assignment.scores.map((score) => ({
          competitorId: score.competitorId,
          status: score.status,
          totalNormalized: score.totalNormalized.toString(),
          items: score.items.map((item) => ({
            criterionId: item.criterionId,
            rawScore: item.rawScore.toString(),
          })),
        })),
      })),
    });
    scoresComplete = computed.scoresComplete;
    if (scoresComplete) {
      scoreBreakdown = computed.scoreBreakdown;
      totals = computed.totals;
    }
  }

  const showWinner = match.status === "COMPLETED" && match.winnerId && match.winner;

  return {
    id: match.id,
    code: match.code,
    round: {
      id: match.round.id,
      displayName: match.round.displayName,
      order: match.round.order,
    },
    status: match.status,
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    actualStartedAt: match.actualStartedAt?.toISOString() ?? null,
    actualEndedAt: match.actualEndedAt?.toISOString() ?? null,
    durationMs,
    competitorA: mapCompetitor(match.competitorA),
    competitorB: mapCompetitor(match.competitorB),
    winner: showWinner
      ? { id: match.winner!.id, displayName: match.winner!.displayName }
      : null,
    isFinalRound: match.round.order === 3 || match.round.name === "final",
    timers: match.timers.map((timer) => ({
      kind: timer.kind,
      kindLabel: timerKindLabel(timer.kind),
      status: timer.status,
      statusLabel: timerStatusLabel(timer.status),
      durationSeconds: timer.durationSeconds,
      remainingSeconds:
        timer.status === "RUNNING"
          ? remainingTimerSeconds({
              now,
              status: timer.status,
              durationSeconds: timer.durationSeconds,
              remainingSnapshot: timer.remainingSnapshot,
              startedAt: timer.startedAt,
              pausedAt: timer.pausedAt,
              accumulatedPausedMs: timer.accumulatedPausedMs,
            })
          : timer.status === "PAUSED" || timer.status === "COMPLETED"
            ? timer.remainingSnapshot
            : null,
    })),
    scoresVisible,
    scoresComplete,
    scoreBreakdown,
    totals,
    updatedAt: now.toISOString(),
  };
}

export { formatMatchDurationLabel };
