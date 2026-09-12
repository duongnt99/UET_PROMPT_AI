import { aggregateScores, formatScoreDisplay } from "@/server/domain/scoring";

export type PublicCriterionInput = {
  id: string;
  titleVi: string;
  weight: number;
};

export type PublicJudgeScoreInput = {
  competitorId: string;
  status: string;
  totalNormalized: string | number;
  items: Array<{
    criterionId: string;
    rawScore: string | number;
  }>;
};

export type PublicJudgeAssignmentInput = {
  status: string;
  scores: PublicJudgeScoreInput[];
};

export type PublicScoreBreakdownRow = {
  criterionId: string;
  criterionName: string;
  weight: number | null;
  teamAScore: string | null;
  teamBScore: string | null;
};

export type PublicScoreTotals = {
  teamA: string;
  teamB: string;
};

export function computePublicMatchScores(params: {
  numberOfJudgesPerMatch: number;
  competitorAId: string | null;
  competitorBId: string | null;
  criteria: PublicCriterionInput[];
  judgeAssignments: PublicJudgeAssignmentInput[];
}): {
  scoresComplete: boolean;
  scoreBreakdown: PublicScoreBreakdownRow[];
  totals: PublicScoreTotals | null;
} {
  const { competitorAId, competitorBId } = params;
  if (!competitorAId || !competitorBId) {
    return { scoresComplete: false, scoreBreakdown: [], totals: null };
  }

  const submittedAssignments = params.judgeAssignments.filter((item) => item.status === "SUBMITTED");
  if (submittedAssignments.length < params.numberOfJudgesPerMatch) {
    return { scoresComplete: false, scoreBreakdown: [], totals: null };
  }

  const scoresA = submittedAssignments.flatMap((assignment) =>
    assignment.scores.filter((score) => score.competitorId === competitorAId && score.status === "SUBMITTED"),
  );
  const scoresB = submittedAssignments.flatMap((assignment) =>
    assignment.scores.filter((score) => score.competitorId === competitorBId && score.status === "SUBMITTED"),
  );

  if (!scoresA.length || !scoresB.length) {
    return { scoresComplete: false, scoreBreakdown: [], totals: null };
  }

  const scoreBreakdown = params.criteria.map((criterion) => {
    const rawA = scoresA
      .flatMap((score) => score.items.filter((item) => item.criterionId === criterion.id))
      .map((item) => item.rawScore);
    const rawB = scoresB
      .flatMap((score) => score.items.filter((item) => item.criterionId === criterion.id))
      .map((item) => item.rawScore);

    return {
      criterionId: criterion.id,
      criterionName: criterion.titleVi,
      weight: criterion.weight,
      teamAScore: rawA.length ? formatScoreDisplay(aggregateScores(rawA)) : null,
      teamBScore: rawB.length ? formatScoreDisplay(aggregateScores(rawB)) : null,
    };
  });

  const totals = {
    teamA: formatScoreDisplay(aggregateScores(scoresA.map((item) => item.totalNormalized))),
    teamB: formatScoreDisplay(aggregateScores(scoresB.map((item) => item.totalNormalized))),
  };

  const hasAllCriterionScores = scoreBreakdown.every((row) => row.teamAScore != null && row.teamBScore != null);
  if (!hasAllCriterionScores) {
    return { scoresComplete: false, scoreBreakdown: [], totals: null };
  }

  return { scoresComplete: true, scoreBreakdown, totals };
}

export function formatMatchDurationLabel(durationMs: number | null): string | null {
  if (durationMs == null || durationMs < 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} giây`;
  return `${minutes} phút ${seconds} giây`;
}
