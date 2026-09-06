import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { detectBracketCycle, buildWinnerAdvancement } from "@/server/domain/bracket";
import { remainingTimerSeconds } from "@/server/domain/timer";
import { aggregateScores, resolveTieState } from "@/server/domain/scoring";
import { getActiveRubric } from "@/server/services/review-service";
import { normalizeCriterionScore, rubricWeightsSumTo100 } from "@/server/domain/scoring";
import { parseCompetitionSettings } from "@/config/competition-settings";
import { Decimal } from "@prisma/client/runtime/library";
import { assertLiveMatchSetup, LIVE_MATCH_STATUSES, assertCanChangePairing } from "@/server/domain/match-setup";
import { normalizeMatchProblem } from "@/server/domain/match-problem";
import { Prisma } from "@prisma/client";
import { assertTransition, MATCH_TRANSITIONS } from "@/server/domain/status-transitions";

export async function validateBracket(competitionId: string) {
  const matches = await prisma.match.findMany({ where: { competitionId } });
  const cycle = detectBracketCycle(matches.map((m) => ({ id: m.id, nextMatchId: m.nextMatchId })));
  if (cycle) throw new Error(`Liên kết bảng đấu tạo thành vòng lặp: ${cycle.join(" → ")}`);
}

export async function createEightTeamBracket(params: {
  actorUserId: string;
  competitionId: string;
  reason: string;
}) {
  const reason = params.reason.trim();
  if (reason.length < 3) throw new Error("Cần ghi lý do khi khởi tạo bảng đấu.");
  const existingCount = await prisma.match.count({ where: { competitionId: params.competitionId } });
  if (existingCount > 0) {
    throw new Error("Cuộc thi đã có trận đấu. Không thể khởi tạo chồng lên bảng hiện tại.");
  }
  const finalists = await prisma.finalist.findMany({
    where: { competitionId: params.competitionId, registration: { status: "SELECTED" } },
    orderBy: [{ seed: "asc" }, { createdAt: "asc" }],
  });
  if (finalists.length !== 8) {
    throw new Error(`Cần đúng 8 đội đã được chọn vào chung kết; hiện có ${finalists.length}.`);
  }

  const createdIds = await prisma.$transaction(async (tx) => {
    const quarter = await tx.finalRound.upsert({
      where: { competitionId_order: { competitionId: params.competitionId, order: 1 } },
      create: { competitionId: params.competitionId, name: "quarter-final", displayName: "Tứ kết", order: 1, status: "SCHEDULED" },
      update: { name: "quarter-final", displayName: "Tứ kết", status: "SCHEDULED" },
    });
    const semi = await tx.finalRound.upsert({
      where: { competitionId_order: { competitionId: params.competitionId, order: 2 } },
      create: { competitionId: params.competitionId, name: "semi-final", displayName: "Bán kết", order: 2, status: "DRAFT" },
      update: { name: "semi-final", displayName: "Bán kết", status: "DRAFT" },
    });
    const finale = await tx.finalRound.upsert({
      where: { competitionId_order: { competitionId: params.competitionId, order: 3 } },
      create: { competitionId: params.competitionId, name: "final", displayName: "Chung kết", order: 3, status: "DRAFT" },
      update: { name: "final", displayName: "Chung kết", status: "DRAFT" },
    });
    const finalMatch = await tx.match.create({
      data: { competitionId: params.competitionId, roundId: finale.id, code: "CK", status: "DRAFT", publicStatus: "PUBLISHED" },
    });
    const sf1 = await tx.match.create({
      data: { competitionId: params.competitionId, roundId: semi.id, code: "BK1", status: "DRAFT", publicStatus: "PUBLISHED", nextMatchId: finalMatch.id, nextSlot: "A" },
    });
    const sf2 = await tx.match.create({
      data: { competitionId: params.competitionId, roundId: semi.id, code: "BK2", status: "DRAFT", publicStatus: "PUBLISHED", nextMatchId: finalMatch.id, nextSlot: "B" },
    });
    const pairs = [[0, 7], [3, 4], [1, 6], [2, 5]] as const;
    const quarterMatches = [];
    for (const [index, pair] of pairs.entries()) {
      quarterMatches.push(await tx.match.create({
        data: {
          competitionId: params.competitionId,
          roundId: quarter.id,
          code: `TK${index + 1}`,
          status: "SCHEDULED",
          publicStatus: "PUBLISHED",
          competitorAId: finalists[pair[0]]!.id,
          competitorBId: finalists[pair[1]]!.id,
          nextMatchId: index < 2 ? sf1.id : sf2.id,
          nextSlot: index % 2 === 0 ? "A" : "B",
        },
      }));
    }
    return [finalMatch.id, sf1.id, sf2.id, ...quarterMatches.map((match) => match.id)];
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: params.competitionId,
    action: "bracket.create_eight_team",
    entityType: "Competition",
    entityId: params.competitionId,
    reason,
    after: { matchIds: createdIds },
  });
  return { matchCount: createdIds.length };
}

export async function advanceWinner(params: {
  actorUserId: string;
  matchId: string;
  winnerId: string;
  reason: string;
  expectedVersion: number;
}) {
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUniqueOrThrow({ where: { id: params.matchId } });
    if (match.version !== params.expectedVersion) {
      throw new Error("Trận vừa được một quản trị viên khác cập nhật. Hãy tải lại trang và thử lại.");
    }
    const advancement = buildWinnerAdvancement({
      winnerId: params.winnerId,
      nextMatchId: match.nextMatchId,
      nextSlot: match.nextSlot,
    });
    await tx.match.update({
      where: { id: match.id },
      data: {
        winnerId: params.winnerId,
        status: "COMPLETED",
        actualEndedAt: new Date(),
        version: { increment: 1 },
      },
    });
    await pauseRunningTimers(tx, match.id);
    await clearCurrentMatchIfThis(tx, match.competitionId, match.id);
    if (advancement) {
      await tx.match.update({
        where: { id: advancement.nextMatchId },
        data:
          advancement.nextSlot === "A"
            ? { competitorAId: advancement.winnerId, version: { increment: 1 } }
            : { competitorBId: advancement.winnerId, version: { increment: 1 } },
      });
    }
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "match.advance_winner",
    entityType: "Match",
    entityId: params.matchId,
    reason: params.reason,
    after: { winnerId: params.winnerId },
  });
}

export async function controlTimer(params: {
  actorUserId: string;
  matchId: string;
  kind: "SPRINT" | "PITCH" | "VERDICT";
  action: "start" | "pause" | "resume";
}) {
  const timer = await prisma.timerSession.findUnique({
    where: { matchId_kind: { matchId: params.matchId, kind: params.kind } },
  });
  if (!timer) throw new Error("Không tìm thấy đồng hồ của phần thi này.");
  const now = new Date();
  if (params.action === "start") {
    await prisma.timerSession.update({
      where: { id: timer.id },
      data: { status: "RUNNING", startedAt: now, remainingSnapshot: timer.durationSeconds },
    });
  } else if (params.action === "pause") {
    const remaining = remainingTimerSeconds({
      now,
      status: timer.status,
      durationSeconds: timer.durationSeconds,
      remainingSnapshot: timer.remainingSnapshot,
      startedAt: timer.startedAt,
      pausedAt: timer.pausedAt,
      accumulatedPausedMs: timer.accumulatedPausedMs,
    });
    await prisma.timerSession.update({
      where: { id: timer.id },
      data: { status: "PAUSED", pausedAt: now, remainingSnapshot: remaining, version: { increment: 1 } },
    });
  } else {
    const extra = timer.pausedAt ? now.getTime() - timer.pausedAt.getTime() : 0;
    await prisma.timerSession.update({
      where: { id: timer.id },
      data: {
        status: "RUNNING",
        pausedAt: null,
        accumulatedPausedMs: timer.accumulatedPausedMs + extra,
        version: { increment: 1 },
      },
    });
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: `timer.${params.action}`,
    entityType: "TimerSession",
    entityId: timer.id,
    after: { matchId: params.matchId, kind: params.kind },
  });
}

export async function saveJudgeDraft(params: {
  judgeId: string;
  assignmentId: string;
  competitorId: string;
  overallComment: string;
  items: { criterionId: string; rawScore: string; comment?: string }[];
}) {
  const assignment = await prisma.judgeAssignment.findUniqueOrThrow({
    where: { id: params.assignmentId },
    include: { match: true },
  });
  if (assignment.judgeId !== params.judgeId) throw new Error("Không có quyền chấm trận này.");
  if (!["SCORING", "VERDICT"].includes(assignment.match.status)) {
    throw new Error("Trận đấu chưa mở chấm.");
  }
  const rubric = await getActiveRubric(assignment.competitionId, "FINAL");
  if (!rubric) throw new Error("Chưa có rubric chung kết.");
  if (!rubricWeightsSumTo100(rubric.criteria.map((c) => c.weight.toString()))) {
    throw new Error("Rubric không hợp lệ.");
  }
  const normalizedItems = params.items.map((item) => {
    const criterion = rubric.criteria.find((c) => c.id === item.criterionId);
    if (!criterion) throw new Error("Tiêu chí không hợp lệ.");
    return {
      ...item,
      normalizedScore: normalizeCriterionScore({
        rawScore: item.rawScore,
        minScore: criterion.minScore.toString(),
        maxScore: criterion.maxScore.toString(),
        weight: criterion.weight.toString(),
      }).toString(),
    };
  });
  const total = normalizedItems.reduce((acc, item) => acc.plus(item.normalizedScore), new Decimal(0));
  await prisma.$transaction(async (tx) => {
    const score = await tx.judgeScore.upsert({
      where: {
        assignmentId_competitorId: {
          assignmentId: assignment.id,
          competitorId: params.competitorId,
        },
      },
      update: { overallComment: params.overallComment, totalNormalized: total, rubricId: rubric.id },
      create: {
        assignmentId: assignment.id,
        matchId: assignment.matchId,
        competitorId: params.competitorId,
        rubricId: rubric.id,
        overallComment: params.overallComment,
        totalNormalized: total,
        status: "DRAFT",
      },
    });
    await tx.judgeScoreItem.deleteMany({ where: { judgeScoreId: score.id } });
    await tx.judgeScoreItem.createMany({
      data: normalizedItems.map((item) => ({
        judgeScoreId: score.id,
        criterionId: item.criterionId,
        rawScore: item.rawScore,
        normalizedScore: item.normalizedScore,
        comment: item.comment ?? "",
      })),
    });
  });
}

export async function submitJudgeScore(params: { judgeId: string; assignmentId: string }) {
  const assignment = await prisma.judgeAssignment.findUniqueOrThrow({
    where: { id: params.assignmentId },
    include: { scores: true, match: true },
  });
  if (assignment.judgeId !== params.judgeId) throw new Error("Không có quyền.");
  const needed = [assignment.match.competitorAId, assignment.match.competitorBId].filter(Boolean);
  const drafted = assignment.scores.filter((score) => needed.includes(score.competitorId));
  if (drafted.length < needed.length) throw new Error("Cần chấm đủ cả hai thí sinh/đội.");
  await prisma.judgeScore.updateMany({
    where: { assignmentId: assignment.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  await prisma.judgeAssignment.update({
    where: { id: assignment.id },
    data: { status: "SUBMITTED" },
  });
  await writeAuditLog({
    actorUserId: params.judgeId,
    action: "judge.submit",
    entityType: "JudgeAssignment",
    entityId: assignment.id,
  });
}

export async function finalizeMatchIfReady(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { judgeAssignments: { include: { scores: true } }, competition: true },
  });
  const settings = parseCompetitionSettings(match.competition.settings);
  const submittedAssignments = match.judgeAssignments.filter((a) => a.status === "SUBMITTED");
  if (submittedAssignments.length < settings.numberOfJudgesPerMatch) return { ready: false as const };
  if (!match.competitorAId || !match.competitorBId) return { ready: false as const };
  const scoresA = submittedAssignments.flatMap((a) =>
    a.scores.filter((s) => s.competitorId === match.competitorAId && s.status === "SUBMITTED"),
  );
  const scoresB = submittedAssignments.flatMap((a) =>
    a.scores.filter((s) => s.competitorId === match.competitorBId && s.status === "SUBMITTED"),
  );
  if (!scoresA.length || !scoresB.length) return { ready: false as const };
  const aggregateA = aggregateScores(scoresA.map((item) => item.totalNormalized.toString()));
  const aggregateB = aggregateScores(scoresB.map((item) => item.totalNormalized.toString()));
  return {
    ready: true as const,
    aggregateA: aggregateA.toString(),
    aggregateB: aggregateB.toString(),
    tieState: resolveTieState({
      aggregateA: aggregateA.toString(),
      aggregateB: aggregateB.toString(),
      tieHandlingMode: settings.tieHandlingMode,
    }),
  };
}

export async function publicEventState(competitionId: string) {
  const competition = await prisma.competition.findUniqueOrThrow({ where: { id: competitionId } });
  const settings = parseCompetitionSettings(competition.settings);
  const match = settings.currentMatchId
    ? await prisma.match.findUnique({
        where: { id: settings.currentMatchId },
        include: {
          competitorA: true,
          competitorB: true,
          round: true,
          timers: true,
          twists: { where: { status: "REVEALED" } },
        },
      })
    : await prisma.match.findFirst({
        where: { competitionId, status: { in: ["SPRINT", "PITCH", "SCORING", "VERDICT", "READY"] } },
        include: {
          competitorA: true,
          competitorB: true,
          round: true,
          timers: true,
          twists: { where: { status: "REVEALED" } },
        },
      });
  const now = new Date();
  return {
    match: match
      ? {
          code: match.code,
          status: match.status,
          round: match.round.displayName,
          competitorA: match.competitorA
            ? { name: match.competitorA.displayName, institution: match.competitorA.institutionPublic }
            : null,
          competitorB: match.competitorB
            ? { name: match.competitorB.displayName, institution: match.competitorB.institutionPublic }
            : null,
          timers: match.timers.map((timer) => ({
            kind: timer.kind,
            status: timer.status,
            remainingSeconds: remainingTimerSeconds({
              now,
              status: timer.status,
              durationSeconds: timer.durationSeconds,
              remainingSnapshot: timer.remainingSnapshot,
              startedAt: timer.startedAt,
              pausedAt: timer.pausedAt,
              accumulatedPausedMs: timer.accumulatedPausedMs,
            }),
          })),
          twist: match.twists[0] ? { title: match.twists[0].title, content: match.twists[0].content } : null,
          problem:
            match.problemTitle.trim() || match.problemPrompt.trim()
              ? { title: match.problemTitle, prompt: match.problemPrompt }
              : null,
        }
      : null,
  };
}

async function resolveRound(competitionId: string, roundId?: string) {
  if (roundId) {
    const round = await prisma.finalRound.findFirst({ where: { id: roundId, competitionId } });
    if (!round) throw new Error("Không tìm thấy vòng đấu.");
    return round;
  }
  const existing = await prisma.finalRound.findFirst({
    where: { competitionId },
    orderBy: { order: "asc" },
  });
  if (existing) return existing;
  const last = await prisma.finalRound.findFirst({
    where: { competitionId },
    orderBy: { order: "desc" },
  });
  return prisma.finalRound.create({
    data: {
      competitionId,
      name: "custom",
      displayName: "Trận tùy chọn",
      order: (last?.order ?? 0) + 1,
      stageType: "MIXED",
      status: "ACTIVE",
    },
  });
}

async function nextMatchCode(competitionId: string) {
  const existing = await prisma.match.findMany({
    where: { competitionId, code: { startsWith: "LIVE-" } },
    select: { code: true },
  });
  const used = new Set(existing.map((item) => item.code));
  for (let index = 1; index < 1000; index += 1) {
    const code = `LIVE-${index}`;
    if (!used.has(code)) return code;
  }
  return `LIVE-${Date.now().toString(36).toUpperCase()}`;
}

export async function createAndOpenScoringMatch(params: {
  actorUserId: string;
  competitorAId: string;
  competitorBId: string;
  judgeIds: string[];
  roundId?: string;
  code?: string;
  setAsCurrent?: boolean;
  reason: string;
  problemTitle?: string;
  problemPrompt?: string;
  challengeId?: string;
}) {
  const reason = params.reason.trim();
  if (reason.length < 3) throw new Error("Cần ghi lý do (audit) khi tạo trận.");
  const setup = assertLiveMatchSetup({
    competitorAId: params.competitorAId,
    competitorBId: params.competitorBId,
    judgeIds: params.judgeIds,
    code: params.code,
  });

  const [competitorA, competitorB] = await Promise.all([
    prisma.finalist.findUnique({ where: { id: params.competitorAId }, include: { registration: true } }),
    prisma.finalist.findUnique({ where: { id: params.competitorBId }, include: { registration: true } }),
  ]);
  if (!competitorA || !competitorB) throw new Error("Không tìm thấy đội vào chung kết.");
  if (competitorA.competitionId !== competitorB.competitionId) {
    throw new Error("Hai đội không thuộc cùng một cuộc thi.");
  }
  if (competitorA.registration.status !== "SELECTED" || competitorB.registration.status !== "SELECTED") {
    throw new Error("Chỉ ghép trận được với đội đã được chọn vào chung kết.");
  }

  const competition = await prisma.competition.findUniqueOrThrow({ where: { id: competitorA.competitionId } });
  const settings = parseCompetitionSettings(competition.settings);
  if (settings.bracketLocked) throw new Error("Bảng đấu đang khóa. Quản trị viên cấp cao cần mở khóa trước khi tạo trận mới.");

  const busy = await prisma.match.findMany({
    where: {
      competitionId: competition.id,
      status: { in: [...LIVE_MATCH_STATUSES] },
      OR: [
        { competitorAId: { in: [competitorA.id, competitorB.id] } },
        { competitorBId: { in: [competitorA.id, competitorB.id] } },
      ],
    },
    select: { code: true, competitorAId: true, competitorBId: true },
  });
  if (busy.length) {
    const codes = busy.map((item) => item.code).join(", ");
    throw new Error(`Một trong hai đội đang thi trận ${codes}. Hãy kết thúc trận đó trước.`);
  }

  const judges = await prisma.user.findMany({
    where: {
      id: { in: setup.judgeIds },
      deletedAt: null,
      status: { not: "DISABLED" },
      roleAssignments: { some: { role: "JUDGE", revokedAt: null } },
    },
    select: { id: true },
  });
  if (judges.length !== setup.judgeIds.length) {
    throw new Error("Một hoặc nhiều tài khoản được chọn không phải giám khảo đang hiệu lực.");
  }

  const round = await resolveRound(competition.id, params.roundId);
  const code = setup.code ?? (await nextMatchCode(competition.id));
  const codeTaken = await prisma.match.findUnique({
    where: { competitionId_code: { competitionId: competition.id, code } },
  });
  if (codeTaken) throw new Error(`Mã trận ${code} đã tồn tại.`);

  let problemTitle = "";
  let problemPrompt = "";
  let challengeId: string | null = null;
  if (params.challengeId) {
    const challenge = await prisma.matchChallenge.findFirst({
      where: { id: params.challengeId, competitionId: competition.id },
    });
    if (!challenge) throw new Error("Không tìm thấy đề thi trong kho.");
    problemTitle = challenge.title;
    problemPrompt = challenge.prompt;
    challengeId = challenge.id;
  } else if (params.problemTitle?.trim() || params.problemPrompt?.trim()) {
    const problem = normalizeMatchProblem({
      title: params.problemTitle ?? "",
      prompt: params.problemPrompt ?? "",
    });
    problemTitle = problem.title;
    problemPrompt = problem.prompt;
  }

  const match = await prisma.$transaction(async (tx) => {
    const created = await tx.match.create({
      data: {
        competitionId: competition.id,
        roundId: round.id,
        code,
        status: "SCORING",
        competitorAId: competitorA.id,
        competitorBId: competitorB.id,
        actualStartedAt: new Date(),
        problemTitle,
        problemPrompt,
        challengeId,
      },
    });
    await tx.timerSession.createMany({
      data: [
        {
          matchId: created.id,
          kind: "SPRINT",
          durationSeconds: settings.sprintDurationSeconds,
          remainingSnapshot: settings.sprintDurationSeconds,
        },
        {
          matchId: created.id,
          kind: "PITCH",
          durationSeconds: settings.pitchDurationSeconds,
          remainingSnapshot: settings.pitchDurationSeconds,
        },
        {
          matchId: created.id,
          kind: "VERDICT",
          durationSeconds: settings.verdictDurationSeconds,
          remainingSnapshot: settings.verdictDurationSeconds,
        },
      ],
    });
    await tx.judgeAssignment.createMany({
      data: judges.map((judge) => ({
        competitionId: competition.id,
        matchId: created.id,
        judgeId: judge.id,
        status: "ASSIGNED",
      })),
    });
    if (params.setAsCurrent !== false) {
      const current = await tx.competition.findUniqueOrThrow({ where: { id: competition.id } });
      const nextSettings = parseCompetitionSettings(current.settings);
      await tx.competition.update({
        where: { id: current.id, version: current.version },
        data: {
          settings: {
            ...nextSettings,
            currentMatchId: created.id,
            currentRoundId: round.id,
          } as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });
    }
    return created;
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: competition.id,
    action: "match.create_scoring",
    entityType: "Match",
    entityId: match.id,
    reason,
    after: {
      code: match.code,
      competitorAId: competitorA.id,
      competitorBId: competitorB.id,
      judgeIds: setup.judgeIds,
    },
  });

  return {
    id: match.id,
    code: match.code,
    competitorA: competitorA.displayName,
    competitorB: competitorB.displayName,
    judgeCount: judges.length,
  };
}

function requireReason(reason: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 3) throw new Error("Cần ghi lý do (audit).");
  return trimmed;
}

async function pauseRunningTimers(
  tx: Prisma.TransactionClient,
  matchId: string,
) {
  const now = new Date();
  const timers = await tx.timerSession.findMany({ where: { matchId } });
  for (const timer of timers) {
    if (timer.status !== "RUNNING") continue;
    const remaining = remainingTimerSeconds({
      now,
      status: timer.status,
      durationSeconds: timer.durationSeconds,
      remainingSnapshot: timer.remainingSnapshot,
      startedAt: timer.startedAt,
      pausedAt: timer.pausedAt,
      accumulatedPausedMs: timer.accumulatedPausedMs,
    });
    await tx.timerSession.update({
      where: { id: timer.id },
      data: { status: "PAUSED", pausedAt: now, remainingSnapshot: remaining, version: { increment: 1 } },
    });
  }
}

async function ensureMatchTimers(
  tx: Prisma.TransactionClient,
  matchId: string,
  settings: { sprintDurationSeconds: number; pitchDurationSeconds: number; verdictDurationSeconds: number },
) {
  const specs = [
    ["SPRINT", settings.sprintDurationSeconds],
    ["PITCH", settings.pitchDurationSeconds],
    ["VERDICT", settings.verdictDurationSeconds],
  ] as const;
  for (const [kind, durationSeconds] of specs) {
    await tx.timerSession.upsert({
      where: { matchId_kind: { matchId, kind } },
      update: {},
      create: { matchId, kind, durationSeconds, remainingSnapshot: durationSeconds },
    });
  }
}

async function clearCurrentMatchIfThis(
  tx: Prisma.TransactionClient,
  competitionId: string,
  matchId: string,
) {
  const current = await tx.competition.findUniqueOrThrow({ where: { id: competitionId } });
  const settings = parseCompetitionSettings(current.settings);
  if (settings.currentMatchId !== matchId) return;
  await tx.competition.update({
    where: { id: current.id, version: current.version },
    data: {
      settings: { ...settings, currentMatchId: null } as Prisma.InputJsonValue,
      version: { increment: 1 },
    },
  });
}

export async function updateMatchPairing(params: {
  actorUserId: string;
  matchId: string;
  competitorAId: string;
  competitorBId: string;
  reason: string;
}) {
  const reason = requireReason(params.reason);
  if (!params.competitorAId || !params.competitorBId) throw new Error("Cần chọn đủ hai finalist.");
  if (params.competitorAId === params.competitorBId) {
    throw new Error("Hai bên trận đấu phải là hai finalist khác nhau.");
  }
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: params.matchId },
    include: { judgeScores: true },
  });
  const submittedScoreCount = match.judgeScores.filter((score) => score.status === "SUBMITTED").length;
  assertCanChangePairing({
    status: match.status,
    bracketLocked: match.bracketLocked,
    submittedScoreCount,
  });

  const [competitorA, competitorB] = await Promise.all([
    prisma.finalist.findUnique({ where: { id: params.competitorAId }, include: { registration: true } }),
    prisma.finalist.findUnique({ where: { id: params.competitorBId }, include: { registration: true } }),
  ]);
  if (!competitorA || !competitorB) throw new Error("Không tìm thấy finalist.");
  if (competitorA.competitionId !== match.competitionId || competitorB.competitionId !== match.competitionId) {
    throw new Error("Finalist không thuộc cuộc thi này.");
  }
  if (competitorA.registration.status !== "SELECTED" || competitorB.registration.status !== "SELECTED") {
    throw new Error("Chỉ ghép được finalist đang SELECTED.");
  }

  const busy = await prisma.match.findFirst({
    where: {
      id: { not: match.id },
      competitionId: match.competitionId,
      status: { in: [...LIVE_MATCH_STATUSES] },
      OR: [
        { competitorAId: { in: [competitorA.id, competitorB.id] } },
        { competitorBId: { in: [competitorA.id, competitorB.id] } },
      ],
    },
    select: { code: true },
  });
  if (busy) throw new Error(`Một đội đang thi trận ${busy.code}.`);

  const keptIds = [competitorA.id, competitorB.id];
  await prisma.$transaction(async (tx) => {
    await tx.judgeScore.deleteMany({
      where: { matchId: match.id, competitorId: { notIn: keptIds }, status: { not: "SUBMITTED" } },
    });
    await tx.match.update({
      where: { id: match.id },
      data: {
        competitorAId: competitorA.id,
        competitorBId: competitorB.id,
        winnerId: null,
        version: { increment: 1 },
      },
    });
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.change_pairing",
    entityType: "Match",
    entityId: match.id,
    reason,
    before: { competitorAId: match.competitorAId, competitorBId: match.competitorBId },
    after: { competitorAId: competitorA.id, competitorBId: competitorB.id },
  });
  return { code: match.code, competitorA: competitorA.displayName, competitorB: competitorB.displayName };
}

export async function stopMatch(params: { actorUserId: string; matchId: string; reason: string }) {
  const reason = requireReason(params.reason);
  const match = await prisma.match.findUniqueOrThrow({ where: { id: params.matchId } });
  if (match.status === "CANCELLED") throw new Error("Trận đã dừng trước đó.");
  if (match.status === "COMPLETED" || match.status === "PUBLISHED" || match.status === "LOCKED") {
    throw new Error("Trận đã kết thúc. Không dừng kiểu hủy được — hãy tạo trận mới nếu cần thi lại.");
  }
  await prisma.$transaction(async (tx) => {
    await pauseRunningTimers(tx, match.id);
    await tx.match.update({
      where: { id: match.id },
      data: { status: "CANCELLED", actualEndedAt: new Date(), version: { increment: 1 } },
    });
    await clearCurrentMatchIfThis(tx, match.competitionId, match.id);
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.stop",
    entityType: "Match",
    entityId: match.id,
    reason,
    before: { status: match.status },
    after: { status: "CANCELLED" },
  });
  return { code: match.code };
}

export async function setMatchStatus(params: {
  actorUserId: string;
  matchId: string;
  status: string;
  reason: string;
}) {
  const reason = requireReason(params.reason);
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: params.matchId },
    include: { competition: true },
  });
  try {
    assertTransition(MATCH_TRANSITIONS, match.status, params.status, "match");
  } catch {
    throw new Error(`Không chuyển được trạng thái từ ${match.status} sang ${params.status}.`);
  }
  if (params.status === "COMPLETED" && !match.winnerId) {
    throw new Error("Chưa có người thắng. Dùng “Công bố thắng cuộc” thay vì chỉ đổi trạng thái.");
  }
  const settings = parseCompetitionSettings(match.competition.settings);
  await prisma.$transaction(async (tx) => {
    if (params.status === "SCORING" || params.status === "READY" || params.status === "SPRINT") {
      await ensureMatchTimers(tx, match.id, settings);
    }
    await tx.match.update({
      where: { id: match.id },
      data: {
        status: params.status as typeof match.status,
        winnerId: match.status === "COMPLETED" && params.status === "SCORING" ? null : undefined,
        actualEndedAt: params.status === "SCORING" && match.status === "COMPLETED" ? null : undefined,
        actualStartedAt: match.actualStartedAt ?? (params.status === "SCORING" ? new Date() : undefined),
        version: { increment: 1 },
      },
    });
    if (params.status === "CANCELLED" || params.status === "COMPLETED") {
      await pauseRunningTimers(tx, match.id);
      if (params.status === "CANCELLED") await clearCurrentMatchIfThis(tx, match.competitionId, match.id);
    }
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.status_change",
    entityType: "Match",
    entityId: match.id,
    reason,
    before: { status: match.status },
    after: { status: params.status },
  });
  return { code: match.code, status: params.status };
}

export async function setCurrentMatch(params: { actorUserId: string; matchId: string; reason: string }) {
  const reason = requireReason(params.reason);
  const match = await prisma.match.findUniqueOrThrow({ where: { id: params.matchId } });
  if (match.status === "CANCELLED") throw new Error("Không đặt trận đã dừng làm trận hiện tại.");
  await prisma.$transaction(async (tx) => {
    const current = await tx.competition.findUniqueOrThrow({ where: { id: match.competitionId } });
    const settings = parseCompetitionSettings(current.settings);
    if (settings.currentMatchId === match.id) return;
    await tx.competition.update({
      where: { id: current.id, version: current.version },
      data: {
        settings: { ...settings, currentMatchId: match.id, currentRoundId: match.roundId } as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.set_current",
    entityType: "Match",
    entityId: match.id,
    reason,
  });
  return { code: match.code };
}

export async function assignMatchJudges(params: {
  actorUserId: string;
  matchId: string;
  judgeIds: string[];
  reason: string;
}) {
  const reason = requireReason(params.reason);
  const judgeIds = [...new Set(params.judgeIds.map((id) => id.trim()).filter(Boolean))];
  if (!judgeIds.length) throw new Error("Cần gán ít nhất một giám khảo.");
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: params.matchId },
    include: { judgeAssignments: true },
  });
  if (match.status === "COMPLETED" || match.status === "CANCELLED" || match.status === "LOCKED") {
    throw new Error("Không đổi giám khảo trên trận đã kết thúc/dừng.");
  }
  const judges = await prisma.user.findMany({
    where: {
      id: { in: judgeIds },
      deletedAt: null,
      status: { not: "DISABLED" },
      roleAssignments: { some: { role: "JUDGE", revokedAt: null } },
    },
    select: { id: true },
  });
  if (judges.length !== judgeIds.length) {
    throw new Error("Một tài khoản được chọn không phải giám khảo đang hiệu lực.");
  }
  const submitted = match.judgeAssignments.filter((item) => item.status === "SUBMITTED");
  const removingSubmitted = submitted.filter((item) => !judgeIds.includes(item.judgeId));
  if (removingSubmitted.length) {
    throw new Error("Không gỡ được giám khảo đã nộp phiếu.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.judgeAssignment.deleteMany({
      where: { matchId: match.id, judgeId: { notIn: judgeIds }, status: { not: "SUBMITTED" } },
    });
    const existing = await tx.judgeAssignment.findMany({ where: { matchId: match.id } });
    const have = new Set(existing.map((item) => item.judgeId));
    const toCreate = judgeIds.filter((id) => !have.has(id));
    if (toCreate.length) {
      await tx.judgeAssignment.createMany({
        data: toCreate.map((judgeId) => ({
          competitionId: match.competitionId,
          matchId: match.id,
          judgeId,
          status: "ASSIGNED",
        })),
      });
    }
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.assign_judges",
    entityType: "Match",
    entityId: match.id,
    reason,
    after: { judgeIds },
  });
  return { code: match.code, judgeCount: judgeIds.length };
}

export async function deleteMatch(params: { actorUserId: string; matchId: string; reason: string }) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: params.matchId },
    include: { judgeScores: true },
  });
  const scoreIds = match.judgeScores.map((item) => item.id);
  await prisma.$transaction(async (tx) => {
    if (scoreIds.length) {
      await tx.judgeScoreItem.deleteMany({ where: { judgeScoreId: { in: scoreIds } } });
    }
    await tx.judgeScore.deleteMany({ where: { matchId: match.id } });
    await tx.judgeAssignment.deleteMany({ where: { matchId: match.id } });
    await tx.timerSession.deleteMany({ where: { matchId: match.id } });
    await tx.onStageTwist.deleteMany({ where: { matchId: match.id } });
    await tx.match.updateMany({
      where: { nextMatchId: match.id },
      data: { nextMatchId: null, nextSlot: null },
    });
    await clearCurrentMatchIfThis(tx, match.competitionId, match.id);
    await tx.match.delete({ where: { id: match.id } });
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: match.competitionId,
    action: "match.delete",
    entityType: "Match",
    entityId: match.id,
    reason: params.reason,
    before: {
      code: match.code,
      status: match.status,
      competitorAId: match.competitorAId,
      competitorBId: match.competitorBId,
    },
  });
  return { code: match.code };
}
