import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { defaultCompetitionSettings } from "@/config/competition-settings";
import {
  acquirePublisherSlot,
  endPublisherSession,
  validatePublisherAccess,
  validateViewerAccess,
} from "@/server/services/live-screen-service";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("live screen persistence", () => {
  const suffix = randomUUID().slice(0, 8);
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const users = await Promise.all(
      [1, 2, 3, 4].map((number) =>
        prisma.user.create({
          data: {
            email: `live-screen-${suffix}-${number}@test.local`,
            emailNormalized: `live-screen-${suffix}-${number}@test.local`,
            passwordHash: "test-only",
          },
        }),
      ),
    );
    ids.user1 = users[0].id;
    ids.user2 = users[1].id;
    ids.user3 = users[2].id;
    ids.user4 = users[3].id;
    const competition = await prisma.competition.create({
      data: {
        name: `Live screen ${suffix}`,
        slug: `live-screen-${suffix}`,
        season: "test",
        settings: defaultCompetitionSettings({ competitionSlug: `live-screen-${suffix}`, currentMatchId: null }) as Prisma.InputJsonValue,
      },
    });
    ids.competition = competition.id;
    const team = await prisma.team.create({
      data: {
        competitionId: competition.id,
        teamName: `Đội test ${suffix}`,
        teamCode: `L${suffix}`,
        invitationCode: `invite-${suffix}`,
        leaderUserId: users[0].id,
        status: "ACTIVE",
        members: {
          create: users.slice(0, 3).map((user) => ({ userId: user.id, status: "ACCEPTED", joinedAt: new Date() })),
        },
      },
    });
    ids.team = team.id;
    const registration = await prisma.registration.create({
      data: {
        competitionId: competition.id,
        ownerUserId: users[0].id,
        teamId: team.id,
        type: "TEAM",
        code: `LIVE-${suffix}`,
        status: "SELECTED",
      },
    });
    ids.registration = registration.id;
    const finalist = await prisma.finalist.create({
      data: {
        competitionId: competition.id,
        registrationId: registration.id,
        displayName: team.teamName,
        seed: 1,
      },
    });
    const individualRegistration = await prisma.registration.create({
      data: {
        competitionId: competition.id,
        ownerUserId: users[3].id,
        type: "INDIVIDUAL",
        code: `LIVE-IND-${suffix}`,
        status: "SELECTED",
      },
    });
    ids.individualRegistration = individualRegistration.id;
    const individualFinalist = await prisma.finalist.create({
      data: {
        competitionId: competition.id,
        registrationId: individualRegistration.id,
        displayName: `Thí sinh cá nhân ${suffix}`,
        seed: 2,
      },
    });
    const round = await prisma.finalRound.create({
      data: { competitionId: competition.id, name: "TEST", displayName: "Test", order: 1, status: "ACTIVE" },
    });
    ids.round = round.id;
    const match = await prisma.match.create({
      data: {
        competitionId: competition.id,
        roundId: round.id,
        code: `LIVE-${suffix}`,
        competitorAId: finalist.id,
        competitorBId: individualFinalist.id,
        status: "READY",
      },
    });
    ids.match = match.id;
    await prisma.competition.update({
      where: { id: competition.id },
      data: {
        settings: defaultCompetitionSettings({
          competitionSlug: competition.slug,
          currentMatchId: match.id,
          currentRoundId: round.id,
        }) as Prisma.InputJsonValue,
      },
    });
  });

  afterAll(async () => {
    if (!ids.competition) return;
    await prisma.internalNote.deleteMany({ where: { contestSessionId: ids.match } });
    await prisma.screenShareSession.deleteMany({ where: { competitionId: ids.competition } });
    await prisma.match.deleteMany({ where: { competitionId: ids.competition } });
    await prisma.finalRound.deleteMany({ where: { competitionId: ids.competition } });
    await prisma.finalist.deleteMany({ where: { competitionId: ids.competition } });
    await prisma.registration.deleteMany({ where: { competitionId: ids.competition } });
    await prisma.teamMember.deleteMany({ where: { teamId: ids.team } });
    await prisma.team.deleteMany({ where: { competitionId: ids.competition } });
    await prisma.competition.delete({ where: { id: ids.competition } });
    await prisma.user.deleteMany({ where: { id: { in: [ids.user1, ids.user2, ids.user3, ids.user4] } } });
  });

  it("enforces two slots and releases a stopped slot", async () => {
    const first = await acquirePublisherSlot({ userId: ids.user1, contestSessionId: ids.match, connectionId: "connection-1" });
    const second = await acquirePublisherSlot({ userId: ids.user2, contestSessionId: ids.match, connectionId: "connection-2" });
    expect([first.slot, second.slot].sort()).toEqual([1, 2]);
    await expect(
      acquirePublisherSlot({ userId: ids.user3, contestSessionId: ids.match, connectionId: "connection-3" }),
    ).rejects.toThrow("đủ 2 luồng");
    await endPublisherSession(first.id, "connection-1", "STOPPED");
    const reclaimed = await acquirePublisherSlot({ userId: ids.user3, contestSessionId: ids.match, connectionId: "connection-3" });
    expect(reclaimed.slot).toBe(first.slot);
  });

  it("rejects publishing outside the authenticated team", async () => {
    const outsider = await prisma.user.create({
      data: {
        email: `live-screen-${suffix}-outsider@test.local`,
        emailNormalized: `live-screen-${suffix}-outsider@test.local`,
        passwordHash: "test-only",
      },
    });
    await expect(validatePublisherAccess({ userId: outsider.id, contestSessionId: ids.match })).rejects.toThrow("không thuộc đội");
    await prisma.user.delete({ where: { id: outsider.id } });
  });

  it("allows an individual finalist to publish without a team", async () => {
    const access = await validatePublisherAccess({ userId: ids.user4, contestSessionId: ids.match });
    expect(access.registration.id).toBe(ids.individualRegistration);
    expect(access.registration.teamId).toBeNull();

    const session = await acquirePublisherSlot({
      userId: ids.user4,
      contestSessionId: ids.match,
      connectionId: "individual-connection",
    });
    expect(session.registrationId).toBe(ids.individualRegistration);
    expect(session.teamId).toBeNull();
    await endPublisherSession(session.id, "individual-connection", "STOPPED");
  });

  it("keeps old team-based monitor links compatible", async () => {
    const access = await validateViewerAccess({
      roles: ["ADMIN"],
      contestSessionId: ids.match,
      registrationId: ids.team,
    });
    expect(access.registration.id).toBe(ids.registration);
  });

  it("persists an internal comment for the correct team registration and session", async () => {
    const note = await prisma.internalNote.create({
      data: {
        registrationId: ids.registration,
        contestSessionId: ids.match,
        authorId: ids.user1,
        body: "Bình luận kiểm thử",
      },
    });
    const found = await prisma.internalNote.findFirst({
      where: { id: note.id, registrationId: ids.registration, contestSessionId: ids.match },
    });
    expect(found?.body).toBe("Bình luận kiểm thử");
  });
});
