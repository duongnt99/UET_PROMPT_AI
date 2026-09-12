/**
 * Seed 8 mock finalist teams + public bracket for scoreboard preview.
 *
 * Usage (inside app container on production):
 *   corepack pnpm exec tsx scripts/seed-mock-finals.ts
 *
 * Reset and re-seed:
 *   SEED_MOCK_FINALS_RESET=1 corepack pnpm exec tsx scripts/seed-mock-finals.ts
 */
import { hashPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/db/prisma";
import { parseCompetitionSettings } from "../src/config/competition-settings";

const MOCK_TAG = "mock-finals-2026";
const MOCK_PASSWORD = "MockFinalPass123!";

const TEAMS: Array<{ name: string; institution: string; code: string }> = [
  { name: "Gemini Pioneers", institution: "UET - ĐHQGHN", code: "MOCK01" },
  { name: "Prompt Masters", institution: "HUST", code: "MOCK02" },
  { name: "Vibe Coders VNU", institution: "VNU", code: "MOCK03" },
  { name: "AI Arena Squad", institution: "NEU", code: "MOCK04" },
  { name: "Neural Ninjas", institution: "HCMUT", code: "MOCK05" },
  { name: "Token Titans", institution: "FTU", code: "MOCK06" },
  { name: "Chain Reaction", institution: "HNUE", code: "MOCK07" },
  { name: "Code Catalyst", institution: "PTIT", code: "MOCK08" },
];

async function getProductionCompetitionId() {
  const competition = await prisma.competition.findFirst({
    where: { isRehearsal: false, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!competition) throw new Error("Không tìm thấy cuộc thi production.");
  return competition;
}

async function clearBracketData(competitionId: string) {
  const allMatchIds = (
    await prisma.match.findMany({ where: { competitionId }, select: { id: true } })
  ).map((m) => m.id);
  if (allMatchIds.length) {
    await prisma.judgeScoreItem.deleteMany({ where: { judgeScore: { matchId: { in: allMatchIds } } } });
    await prisma.judgeScore.deleteMany({ where: { matchId: { in: allMatchIds } } });
    await prisma.judgeAssignment.deleteMany({ where: { matchId: { in: allMatchIds } } });
    await prisma.timerSession.deleteMany({ where: { matchId: { in: allMatchIds } } });
    await prisma.onStageTwist.deleteMany({ where: { matchId: { in: allMatchIds } } });
    await prisma.match.updateMany({ where: { competitionId }, data: { nextMatchId: null, nextSlot: null } });
    await prisma.match.deleteMany({ where: { competitionId } });
  }
  await prisma.finalRound.deleteMany({ where: { competitionId } });
}

async function clearMockData(competitionId: string) {
  await clearBracketData(competitionId);

  const mockTeams = await prisma.team.findMany({
    where: { competitionId, teamCode: { startsWith: "MOCK" } },
    select: { id: true, registration: { select: { id: true } } },
  });
  const mockRegIds = mockTeams.map((t) => t.registration?.id).filter(Boolean) as string[];
  const mockFinalists = await prisma.finalist.findMany({
    where: {
      competitionId,
      OR: [
        { registrationId: { in: mockRegIds } },
        { displayName: { in: TEAMS.map((t) => t.name) } },
      ],
    },
    select: { id: true },
  });
  const finalistIds = mockFinalists.map((f) => f.id);

  if (finalistIds.length) {
    await prisma.finalist.deleteMany({ where: { id: { in: finalistIds } } });
  }

  for (const regId of mockRegIds) {
    await prisma.registrationSeat.deleteMany({ where: { registrationId: regId } });
    await prisma.registration.delete({ where: { id: regId } });
  }

  for (const team of mockTeams) {
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
    await prisma.team.delete({ where: { id: team.id } });
  }

  for (let i = 1; i <= TEAMS.length; i += 1) {
    const email = `${MOCK_TAG}-leader-${String(i).padStart(2, "0")}@example.com`;
    const user = await prisma.user.findUnique({ where: { emailNormalized: email } });
    if (user) {
      await prisma.roleAssignment.deleteMany({ where: { userId: user.id } });
      await prisma.participantProfile.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  }

  const remainingMatches = await prisma.match.count({ where: { competitionId } });
  if (remainingMatches === 0) {
    await prisma.finalRound.deleteMany({ where: { competitionId } });
  }
}

async function main() {
  const reset = process.env.SEED_MOCK_FINALS_RESET === "1";
  const competition = await getProductionCompetitionId();
  const competitionId = competition.id;

  const existingBracket = await prisma.match.count({ where: { competitionId } });
  const existingMockFinalists = await prisma.finalist.count({
    where: { competitionId, displayName: { in: TEAMS.map((t) => t.name) } },
  });

  if (existingBracket > 0 && !existingMockFinalists && !reset) {
    throw new Error(
      "Cuộc thi đã có bảng đấu khác. Đặt SEED_MOCK_FINALS_RESET=1 nếu muốn xóa mock data cũ (không xóa bracket không liên quan).",
    );
  }

  if (reset || existingMockFinalists > 0) {
    await clearMockData(competitionId);
  } else if (existingMockFinalists > 0) {
    console.info("Mock finalists đã tồn tại, bỏ qua.");
    return;
  }

  const passwordHash = await hashPassword(MOCK_PASSWORD);
  const finalists: Array<{ id: string; name: string }> = [];

  for (const [index, team] of TEAMS.entries()) {
    const email = `${MOCK_TAG}-leader-${String(index + 1).padStart(2, "0")}@example.com`;
    const leader = await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        name: `${team.name} Leader`,
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roleAssignments: { create: { role: "PARTICIPANT" } },
        profile: { create: { fullName: `${team.name} Leader`, institution: team.institution } },
      },
    });

    const createdTeam = await prisma.team.create({
      data: {
        competitionId,
        teamName: team.name,
        teamCode: team.code,
        leaderUserId: leader.id,
        invitationCode: `INV-${team.code}`,
        status: "ACTIVE",
        shortIntroduction: `Đội demo chung kết — ${team.institution}`,
        members: {
          create: {
            userId: leader.id,
            status: "ACCEPTED",
            roleLabel: "Nhóm trưởng",
            joinedAt: new Date(),
          },
        },
      },
    });

    const registration = await prisma.registration.create({
      data: {
        competitionId,
        ownerUserId: leader.id,
        teamId: createdTeam.id,
        type: "TEAM",
        code: `MOCK-REG-${team.code}`,
        status: "SELECTED",
        submittedAt: new Date(),
        lockedAt: new Date(),
        seats: { create: { userId: leader.id, competitionId } },
      },
    });

    const finalist = await prisma.finalist.create({
      data: {
        competitionId,
        registrationId: registration.id,
        seed: index + 1,
        displayName: team.name,
        institutionPublic: team.institution,
        published: true,
        publishedAt: new Date(),
        overrideReason: MOCK_TAG,
      },
    });
    finalists.push({ id: finalist.id, name: team.name });
  }

  const quarter = await prisma.finalRound.upsert({
    where: { competitionId_order: { competitionId, order: 1 } },
    create: {
      competitionId,
      name: "quarter-final",
      displayName: "Tứ kết",
      order: 1,
      status: "COMPLETED",
    },
    update: { name: "quarter-final", displayName: "Tứ kết", status: "COMPLETED" },
  });
  const semi = await prisma.finalRound.upsert({
    where: { competitionId_order: { competitionId, order: 2 } },
    create: {
      competitionId,
      name: "semi-final",
      displayName: "Bán kết",
      order: 2,
      status: "ACTIVE",
    },
    update: { name: "semi-final", displayName: "Bán kết", status: "ACTIVE" },
  });
  const finale = await prisma.finalRound.upsert({
    where: { competitionId_order: { competitionId, order: 3 } },
    create: {
      competitionId,
      name: "final",
      displayName: "Chung kết",
      order: 3,
      status: "SCHEDULED",
    },
    update: { name: "final", displayName: "Chung kết", status: "SCHEDULED" },
  });

  const finalMatch = await prisma.match.create({
    data: {
      competitionId,
      roundId: finale.id,
      code: "CK",
      status: "SCHEDULED",
      publicStatus: "PUBLISHED",
    },
  });
  const sf1 = await prisma.match.create({
    data: {
      competitionId,
      roundId: semi.id,
      code: "BK1",
      status: "DRAFT",
      publicStatus: "PUBLISHED",
      nextMatchId: finalMatch.id,
      nextSlot: "A",
    },
  });
  const sf2 = await prisma.match.create({
    data: {
      competitionId,
      roundId: semi.id,
      code: "BK2",
      status: "DRAFT",
      publicStatus: "PUBLISHED",
      nextMatchId: finalMatch.id,
      nextSlot: "B",
    },
  });

  const pairs = [[0, 7], [3, 4], [1, 6], [2, 5]] as const;
  const quarterWinners: string[] = [];
  const quarterMatches = [];

  for (const [index, pair] of pairs.entries()) {
    const winner = finalists[pair[0]]!;
    quarterWinners.push(winner.id);
    const match = await prisma.match.create({
      data: {
        competitionId,
        roundId: quarter.id,
        code: `TK${index + 1}`,
        status: "COMPLETED",
        publicStatus: "PUBLISHED",
        competitorAId: finalists[pair[0]]!.id,
        competitorBId: finalists[pair[1]]!.id,
        winnerId: winner.id,
        nextMatchId: index < 2 ? sf1.id : sf2.id,
        nextSlot: index % 2 === 0 ? "A" : "B",
        actualStartedAt: new Date(Date.now() - (4 - index) * 3600_000),
        actualEndedAt: new Date(Date.now() - (4 - index) * 3000_000),
      },
    });
    quarterMatches.push(match);
  }

  // BK1: Gemini Pioneers vs AI Arena Squad → Gemini Pioneers
  const bk1Winner = finalists[0]!;
  await prisma.match.update({
    where: { id: sf1.id },
    data: {
      competitorAId: finalists[0]!.id,
      competitorBId: finalists[3]!.id,
      winnerId: bk1Winner.id,
      status: "COMPLETED",
      actualStartedAt: new Date(Date.now() - 1800_000),
      actualEndedAt: new Date(Date.now() - 1200_000),
    },
  });
  await prisma.match.update({
    where: { id: finalMatch.id },
    data: { competitorAId: bk1Winner.id },
  });

  // BK2: Prompt Masters vs Vibe Coders — đang thi (SCORING)
  await prisma.match.update({
    where: { id: sf2.id },
    data: {
      competitorAId: finalists[1]!.id,
      competitorBId: finalists[2]!.id,
      status: "SCORING",
      actualStartedAt: new Date(),
    },
  });
  await prisma.timerSession.create({
    data: {
      matchId: sf2.id,
      kind: "SPRINT",
      status: "RUNNING",
      durationSeconds: 300,
      remainingSnapshot: 142,
      startedAt: new Date(),
    },
  });

  const settings = parseCompetitionSettings(competition.settings);
  await prisma.competition.update({
    where: { id: competitionId },
    data: {
      settings: {
        ...settings,
        publicScoreboardEnabled: true,
        finalistPublicationEnabled: true,
        currentMatchId: sf2.id,
      },
    },
  });

  console.info("MOCK_FINALS_SEEDED", {
    competitionId,
    teams: TEAMS.map((t) => t.name),
    bracket: {
      quarter: quarterMatches.map((m) => m.code),
      semiLive: "BK2",
      championSlot: bk1Winner.name,
    },
    scoreboardUrl: "/scoreboard",
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
