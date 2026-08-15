import { prisma } from "@/lib/db/prisma";
import { requireProductionCompetition } from "@/server/services/competition-service";
import {
  assertSingleActiveRegistration,
  canSubmitRegistration,
  isRegistrationTypeAllowed,
} from "@/server/domain/registration-rules";
import { validateTeamSize } from "@/server/domain/team-rules";
import { isDeadlinePassed } from "@/server/domain/deadlines";
import { assertTransition, REGISTRATION_TRANSITIONS } from "@/server/domain/status-transitions";
import { enqueueEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { generateCode, normalizeEmail } from "@/lib/utils";
import { createRawToken, hashToken } from "@/lib/auth/password";
import { getEnv } from "@/config/env";
import { formatDateTime } from "@/lib/dates";
import { upsertFinalistFromRegistration } from "@/server/services/finalist-service";

export async function getMyRegistration(userId: string, competitionId: string) {
  const seat = await prisma.registrationSeat.findUnique({
    where: { userId_competitionId: { userId, competitionId } },
  });
  if (!seat) return null;
  return prisma.registration.findFirst({
    where: { id: seat.registrationId, deletedAt: null },
    include: {
      team: { include: { members: { include: { user: true } }, invitations: true } },
      owner: true,
      submissions: true,
    },
  });
}

export async function createRegistrationDraft(params: {
  userId: string;
  type: "INDIVIDUAL" | "TEAM";
  teamName?: string;
}) {
  const competition = await requireProductionCompetition();
  const settings = competition.settings;
  if (!isRegistrationTypeAllowed(settings.registrationMode, params.type)) {
    throw new Error("Hình thức đăng ký này hiện không được mở.");
  }
  const existing = await prisma.registrationSeat.findUnique({
    where: { userId_competitionId: { userId: params.userId, competitionId: competition.id } },
  });
  const uniqueness = assertSingleActiveRegistration({ existingActiveCount: existing ? 1 : 0 });
  if (!uniqueness.ok) throw new Error(uniqueness.message);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: params.userId },
    include: { profile: true },
  });

  return prisma.$transaction(async (tx) => {
    let teamId: string | undefined;
    if (params.type === "TEAM") {
      const team = await tx.team.create({
        data: {
          competitionId: competition.id,
          teamName: params.teamName || "Đội chưa đặt tên",
          teamCode: generateCode("TEAM", 6),
          leaderUserId: params.userId,
          invitationCode: generateCode("INV", 8),
          members: {
            create: {
              userId: params.userId,
              status: "ACCEPTED",
              roleLabel: "Nhóm trưởng",
              joinedAt: new Date(),
            },
          },
        },
      });
      teamId = team.id;
    }
    const registration = await tx.registration.create({
      data: {
        competitionId: competition.id,
        ownerUserId: params.userId,
        teamId,
        type: params.type,
        code: generateCode("PO26", 8),
        status: "DRAFT",
        lastAutosavedAt: new Date(),
        statusHistory: { create: { toStatus: "DRAFT", actorUserId: params.userId } },
        seats: { create: { userId: params.userId, competitionId: competition.id } },
      },
    });
    if (!user.profile) {
      await tx.participantProfile.create({
        data: { userId: params.userId, fullName: user.name ?? "" },
      });
    }
    return registration;
  });
}

export async function saveProfile(params: {
  userId: string;
  data: {
    fullName: string;
    phoneNumber?: string;
    institution?: string;
    facultyOrDepartment?: string;
    major?: string;
    studentId?: string;
    academicYear?: string;
    provinceOrCity?: string;
    shortBio?: string;
  };
}) {
  return prisma.participantProfile.upsert({
    where: { userId: params.userId },
    update: params.data,
    create: { userId: params.userId, ...params.data },
  });
}

export async function inviteTeamMember(params: {
  actorUserId: string;
  email: string;
}) {
  const competition = await requireProductionCompetition();
  const registration = await getMyRegistration(params.actorUserId, competition.id);
  if (!registration?.team || registration.ownerUserId !== params.actorUserId) {
    throw new Error("Chỉ nhóm trưởng mới được mời thành viên.");
  }
  if (!competition.settings.allowTeamInvitations) {
    throw new Error("Ban Tổ chức chưa cho phép mời thành viên.");
  }
  const token = createRawToken();
  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId: registration.team.id,
      email: normalizeEmail(params.email),
      tokenHash: hashToken(token),
      invitedById: params.actorUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  await enqueueEmail({
    toEmail: params.email,
    templateCode: "team_invite",
    payload: {
      teamName: registration.team.teamName,
      inviteUrl: `${getEnv().APP_URL}/loi-moi-doi?token=${token}`,
    },
    idempotencyKey: `team_invite:${invitation.id}`,
  });
  return invitation;
}

export async function acceptTeamInvitation(params: { userId: string; token: string }) {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { tokenHash: hashToken(params.token) },
    include: { team: { include: { registration: true } } },
  });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new Error("Lời mời không hợp lệ hoặc đã hết hạn.");
  }
  const competitionId = invitation.team.competitionId;
  const existing = await prisma.registrationSeat.findUnique({
    where: { userId_competitionId: { userId: params.userId, competitionId } },
  });
  if (existing) throw new Error("Bạn đã thuộc một hồ sơ đăng ký khác.");
  await prisma.$transaction(async (tx) => {
    await tx.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date(), inviteeId: params.userId },
    });
    await tx.teamMember.upsert({
      where: { teamId_userId: { teamId: invitation.teamId, userId: params.userId } },
      update: { status: "ACCEPTED", joinedAt: new Date() },
      create: {
        teamId: invitation.teamId,
        userId: params.userId,
        status: "ACCEPTED",
        joinedAt: new Date(),
      },
    });
    if (invitation.team.registration) {
      await tx.registrationSeat.create({
        data: {
          userId: params.userId,
          competitionId,
          registrationId: invitation.team.registration.id,
        },
      });
    }
  });
}

export async function submitRegistration(params: {
  userId: string;
  consents: {
    consentToRules: boolean;
    consentToDataProcessing: boolean;
    consentToPublicFinalistProfile: boolean;
  };
  idempotencyKey: string;
}) {
  const competition = await requireProductionCompetition();
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: {
      userId_action_key: {
        userId: params.userId,
        action: "registration.submit",
        key: params.idempotencyKey,
      },
    },
  });
  if (existingKey?.responseJson) {
    return existingKey.responseJson as { ok: true; code: string };
  }
  const modeCheck = canSubmitRegistration(competition.settings.registrationMode);
  if (!modeCheck.ok) throw new Error(modeCheck.message);
  const registration = await getMyRegistration(params.userId, competition.id);
  if (!registration) throw new Error("Chưa có hồ sơ đăng ký.");
  if (registration.ownerUserId !== params.userId) {
    throw new Error("Chỉ chủ hồ sơ / nhóm trưởng mới được nộp.");
  }
  const override = await prisma.deadlineOverride.findFirst({
    where: { registrationId: registration.id, kind: "registration" },
    orderBy: { createdAt: "desc" },
  });
  if (
    isDeadlinePassed({
      now: new Date(),
      closeAt: competition.settings.registrationCloseAt,
      overrideDeadline: override?.newDeadline,
    })
  ) {
    throw new Error("Đã hết hạn đăng ký.");
  }
  const profile = await prisma.participantProfile.findUnique({ where: { userId: params.userId } });
  if (!profile?.fullName || !profile.institution || !profile.studentId) {
    throw new Error("Hồ sơ cá nhân chưa đủ: họ tên, trường, mã sinh viên.");
  }
  if (!params.consents.consentToRules || !params.consents.consentToDataProcessing) {
    throw new Error("Bạn cần đồng ý thể lệ và chính sách dữ liệu.");
  }
  if (registration.type === "TEAM") {
    const accepted = await prisma.teamMember.count({
      where: { teamId: registration.teamId!, status: "ACCEPTED" },
    });
    const size = validateTeamSize({
      acceptedMemberCount: accepted,
      minSize: competition.settings.teamMinSize,
      maxSize: competition.settings.teamMaxSize,
    });
    if (!size.ok) throw new Error(size.message);
  }
  assertTransition(REGISTRATION_TRANSITIONS, registration.status, "SUBMITTED", "registration");

  const result = await prisma.$transaction(async (tx) => {
    const submittedAt = new Date();
    const updated = await tx.registration.update({
      where: { id: registration.id, version: registration.version },
      data: {
        status: "SUBMITTED",
        submittedAt,
        confirmationEmailKey: registration.confirmationEmailKey ?? `reg:${registration.id}`,
        version: { increment: 1 },
        statusHistory: {
          create: { fromStatus: registration.status, toStatus: "SUBMITTED", actorUserId: params.userId },
        },
      },
    });
    await tx.participantProfile.update({
      where: { userId: params.userId },
      data: {
        consentToRules: true,
        consentToDataProcessing: true,
        consentToPublicFinalistProfile: params.consents.consentToPublicFinalistProfile,
        consentToRulesAt: submittedAt,
        consentToDataProcessingAt: submittedAt,
        consentToPublicFinalistAt: params.consents.consentToPublicFinalistProfile ? submittedAt : null,
      },
    });
    await tx.consentRecord.createMany({
      data: [
        { userId: params.userId, type: "rules", accepted: true },
        { userId: params.userId, type: "data_processing", accepted: true },
        {
          userId: params.userId,
          type: "public_finalist_profile",
          accepted: params.consents.consentToPublicFinalistProfile,
        },
      ],
    });
    if (!registration.confirmationEmailKey) {
      await enqueueEmail({
        toEmail: (await tx.user.findUniqueOrThrow({ where: { id: params.userId } })).email,
        templateCode: "registration_confirm",
        payload: {
          code: updated.code,
          submittedAt: formatDateTime(submittedAt),
        },
        idempotencyKey: `registration_confirm:${updated.id}`,
      });
    }
    await tx.idempotencyKey.create({
      data: {
        userId: params.userId,
        action: "registration.submit",
        key: params.idempotencyKey,
        responseJson: { ok: true, code: updated.code },
      },
    });
    return { ok: true as const, code: updated.code };
  });
  await writeAuditLog({
    actorUserId: params.userId,
    competitionId: competition.id,
    action: "registration.submit",
    entityType: "Registration",
    entityId: registration.id,
    after: { code: result.code, status: "SUBMITTED" },
  });
  return result;
}

export async function adminChangeRegistrationStatus(params: {
  actorUserId: string;
  registrationId: string;
  toStatus: "NEEDS_UPDATE" | "ELIGIBLE" | "INELIGIBLE" | "UNDER_REVIEW" | "SELECTED" | "NOT_SELECTED" | "LOCKED" | "WITHDRAWN";
  reason: string;
}) {
  const registration = await prisma.registration.findUniqueOrThrow({
    where: { id: params.registrationId },
  });
  assertTransition(REGISTRATION_TRANSITIONS, registration.status, params.toStatus, "registration");
  await prisma.registration.update({
    where: { id: registration.id },
    data: {
      status: params.toStatus,
      version: { increment: 1 },
      statusHistory: {
        create: {
          fromStatus: registration.status,
          toStatus: params.toStatus,
          reason: params.reason,
          actorUserId: params.actorUserId,
        },
      },
    },
  });
  if (params.toStatus === "NEEDS_UPDATE") {
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: registration.ownerUserId } });
    await enqueueEmail({
      toEmail: owner.email,
      templateCode: "registration_update_request",
      payload: { reason: params.reason },
      idempotencyKey: `reg_update:${registration.id}:${Date.now()}`,
    });
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: registration.competitionId,
    action: "registration.status_change",
    entityType: "Registration",
    entityId: registration.id,
    before: { status: registration.status },
    after: { status: params.toStatus },
    reason: params.reason,
  });
  if (params.toStatus === "SELECTED") {
    await upsertFinalistFromRegistration({
      registrationId: registration.id,
      overrideReason: params.reason,
      published: false,
    });
  }
  if (params.toStatus === "NOT_SELECTED") {
    await prisma.finalist.updateMany({
      where: { registrationId: registration.id },
      data: { published: false, publishedAt: null, overrideReason: params.reason },
    });
  }
}
