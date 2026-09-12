import { normalizeProfileData } from "@/config/field-limits";
import { prisma } from "@/lib/db/prisma";
import { requireProductionCompetition } from "@/server/services/competition-service";
import {
  assertSingleActiveRegistration,
  canEditTeamRoster,
  canSubmitRegistration,
  canSubmitRegistrationStatus,
  isRegistrationTypeAllowed,
} from "@/server/domain/registration-rules";
import {
  canAddTeamMember,
  canInviteMember,
  validateTeamSize,
} from "@/server/domain/team-rules";
import { isDeadlinePassed } from "@/server/domain/deadlines";
import {
  isParticipantProfileComplete,
  missingParticipantProfileFields,
} from "@/server/domain/participant-profile";
import { assertTransition, REGISTRATION_TRANSITIONS } from "@/server/domain/status-transitions";
import { writeAuditLog } from "@/lib/audit";
import { generateCode, normalizeEmail } from "@/lib/utils";
import { createRawToken, hashToken } from "@/lib/auth/password";
import { upsertFinalistFromRegistration } from "@/server/services/finalist-service";
import { notifyUser } from "@/lib/notifications";
import { Prisma } from "@prisma/client";

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
  if (existing) {
    const current = await prisma.registration.findFirst({
      where: { id: existing.registrationId, deletedAt: null },
    });
    if (current) return current;
  }
  const uniqueness = assertSingleActiveRegistration({ existingActiveCount: existing ? 1 : 0 });
  if (!uniqueness.ok) throw new Error(uniqueness.message);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: params.userId },
    include: { profile: true },
  });

  try {
    return await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const retry = await getMyRegistration(params.userId, competition.id);
      if (retry) return retry;
    }
    throw error;
  }
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
  const data = normalizeProfileData(params.data);
  return prisma.participantProfile.upsert({
    where: { userId: params.userId },
    update: data,
    create: { userId: params.userId, ...data },
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
  const rosterCheck = canEditTeamRoster({
    status: registration.status,
    allowEditAfterSubmit: competition.settings.allowParticipantEditAfterSubmit,
  });
  if (!rosterCheck.ok) throw new Error(rosterCheck.message);
  const inviteCheck = canInviteMember({
    allowTeamInvitations: competition.settings.allowTeamInvitations,
    teamLocked: registration.team.status === "LOCKED",
  });
  if (!inviteCheck.ok) throw new Error(inviteCheck.message);
  const [acceptedMemberCount, pendingInvitationCount] = await Promise.all([
    prisma.teamMember.count({
      where: { teamId: registration.team.id, status: "ACCEPTED" },
    }),
    prisma.teamInvitation.count({
      where: { teamId: registration.team.id, status: "PENDING", expiresAt: { gt: new Date() } },
    }),
  ]);
  const capacityCheck = canAddTeamMember({
    acceptedMemberCount,
    pendingInvitationCount,
    settings: {
      minSize: competition.settings.teamMinSize,
      maxSize: competition.settings.teamMaxSize,
    },
  });
  if (!capacityCheck.ok) throw new Error(capacityCheck.message);
  const email = normalizeEmail(params.email);
  const invitee = await prisma.user.findUnique({ where: { emailNormalized: email } });
  if (!invitee || invitee.deletedAt || invitee.status !== "ACTIVE") {
    throw new Error("Email này chưa có tài khoản đang hoạt động trong hệ thống.");
  }
  if (invitee.id === params.actorUserId) {
    throw new Error("Bạn đã là nhóm trưởng của đội này.");
  }
  const occupiedSeat = await prisma.registrationSeat.findUnique({
    where: { userId_competitionId: { userId: invitee.id, competitionId: competition.id } },
  });
  if (occupiedSeat) {
    throw new Error("Tài khoản này đã thuộc một hồ sơ dự thi khác trong cùng cuộc thi.");
  }
  const pending = await prisma.teamInvitation.findFirst({
    where: {
      teamId: registration.team.id,
      status: "PENDING",
      OR: [
        { inviteeId: invitee.id },
        { inviteeId: null, email: { equals: email, mode: "insensitive" } },
      ],
    },
  });
  if (pending) {
    if (!pending.inviteeId) {
      await prisma.teamInvitation.update({ where: { id: pending.id }, data: { inviteeId: invitee.id } });
    }
    await notifyUser({
      id: `team-invitation:${pending.id}`,
      userId: invitee.id,
      title: "Lời mời tham gia đội",
      body: `Bạn được mời tham gia đội ${registration.team.teamName}.`,
      href: "/dashboard/doi-thi",
    });
    return pending;
  }
  const token = createRawToken();
  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId: registration.team.id,
      email,
      tokenHash: hashToken(token),
      invitedById: params.actorUserId,
      inviteeId: invitee.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  await notifyUser({
    id: `team-invitation:${invitation.id}`,
    userId: invitee.id,
    title: "Lời mời tham gia đội",
    body: `Bạn được mời tham gia đội ${registration.team.teamName}.`,
    href: "/dashboard/doi-thi",
  });
  return invitation;
}

export async function getPendingTeamInvitations(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return prisma.teamInvitation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { gt: new Date() },
      OR: [
        { inviteeId: userId },
        { inviteeId: null, email: { equals: user.emailNormalized, mode: "insensitive" } },
      ],
    },
    include: {
      team: { include: { competition: true, registration: true } },
      invitedBy: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function requireTeamInvitationForUser(userId: string, invitationId: string) {
  const [user, invitation] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: { team: { include: { registration: true } } },
    }),
  ]);
  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt < new Date() ||
    (invitation.inviteeId !== userId && normalizeEmail(invitation.email) !== user.emailNormalized)
  ) {
    throw new Error("Lời mời không hợp lệ hoặc đã hết hạn.");
  }
  return invitation;
}

export async function acceptTeamInvitation(params: { userId: string; invitationId: string }) {
  const invitation = await requireTeamInvitationForUser(params.userId, params.invitationId);
  const competitionId = invitation.team.competitionId;
  const competition = await requireProductionCompetition();
  if (competition.id !== competitionId) {
    throw new Error("Lời mời không thuộc cuộc thi hiện tại.");
  }
  const registration = invitation.team.registration;
  if (registration) {
    const rosterCheck = canEditTeamRoster({
      status: registration.status,
      allowEditAfterSubmit: competition.settings.allowParticipantEditAfterSubmit,
    });
    if (!rosterCheck.ok) throw new Error(rosterCheck.message);
  }
  const existing = await prisma.registrationSeat.findUnique({
    where: { userId_competitionId: { userId: params.userId, competitionId } },
  });
  if (existing) throw new Error("Bạn đã thuộc một hồ sơ đăng ký khác.");
  await prisma.$transaction(async (tx) => {
    const acceptedMemberCount = await tx.teamMember.count({
      where: { teamId: invitation.teamId, status: "ACCEPTED" },
    });
    const capacityCheck = canAddTeamMember({
      acceptedMemberCount,
      pendingInvitationCount: 0,
      settings: {
        minSize: competition.settings.teamMinSize,
        maxSize: competition.settings.teamMaxSize,
      },
    });
    if (!capacityCheck.ok) throw new Error(capacityCheck.message);

    const updatedInvite = await tx.teamInvitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: { status: "ACCEPTED", acceptedAt: new Date(), inviteeId: params.userId },
    });
    if (updatedInvite.count === 0) {
      throw new Error("Lời mời không còn hợp lệ.");
    }
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
    await tx.notification.updateMany({
      where: { id: `team-invitation:${invitation.id}`, userId: params.userId },
      data: { readAt: new Date() },
    });
  });
  await notifyUser({
    id: `team-invitation-response:${invitation.id}`,
    userId: invitation.invitedById,
    title: "Lời mời đội đã được chấp nhận",
    body: `Thành viên ${invitation.email} đã tham gia đội ${invitation.team.teamName}.`,
    href: "/dashboard/doi-thi",
  });
  return { teamName: invitation.team.teamName };
}

export async function declineTeamInvitation(params: { userId: string; invitationId: string }) {
  const invitation = await requireTeamInvitationForUser(params.userId, params.invitationId);
  await prisma.$transaction([
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "DECLINED", inviteeId: params.userId },
    }),
    prisma.notification.updateMany({
      where: { id: `team-invitation:${invitation.id}`, userId: params.userId },
      data: { readAt: new Date() },
    }),
  ]);
  await notifyUser({
    id: `team-invitation-response:${invitation.id}`,
    userId: invitation.invitedById,
    title: "Lời mời đội đã bị từ chối",
    body: `Tài khoản ${invitation.email} đã từ chối tham gia đội ${invitation.team.teamName}.`,
    href: "/dashboard/doi-thi",
  });
  return { teamName: invitation.team.teamName };
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
  const submitState = canSubmitRegistrationStatus(registration.status);
  if (!submitState.ok) throw new Error(submitState.message);
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
  if (!isParticipantProfileComplete(profile)) {
    throw new Error("Hồ sơ cá nhân chưa đủ: họ tên, trường, mã sinh viên.");
  }
  if (!params.consents.consentToRules || !params.consents.consentToDataProcessing) {
    throw new Error("Bạn cần đồng ý thể lệ và chính sách dữ liệu.");
  }
  if (registration.type === "TEAM") {
    const members = await prisma.teamMember.findMany({
      where: { teamId: registration.teamId!, status: "ACCEPTED" },
      include: { user: { include: { profile: true } } },
    });
    const size = validateTeamSize({
      acceptedMemberCount: members.length,
      minSize: competition.settings.teamMinSize,
      maxSize: competition.settings.teamMaxSize,
    });
    if (!size.ok) throw new Error(size.message);
    const missingDetails = members
      .map((member) => {
        const missing = missingParticipantProfileFields(member.user.profile);
        if (missing.length === 0) return null;
        const label = member.user.profile?.fullName || member.user.name || member.user.email;
        return `${label} (thiếu: ${missing.join(", ")})`;
      })
      .filter(Boolean);
    if (missingDetails.length > 0) {
      throw new Error(
        `Tất cả thành viên trong nhóm cần hoàn tất hồ sơ (họ tên, trường, mã sinh viên) trước khi nộp. ${missingDetails.join("; ")}.`,
      );
    }
  }
  assertTransition(REGISTRATION_TRANSITIONS, registration.status, "SUBMITTED", "registration");

  const result = await prisma.$transaction(async (tx) => {
    const submittedAt = new Date();
    const updated = await tx.registration.updateMany({
      where: {
        id: registration.id,
        version: registration.version,
        status: { in: ["DRAFT", "NEEDS_UPDATE"] },
      },
      data: {
        status: "SUBMITTED",
        submittedAt,
        version: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      throw new Error("Hồ sơ đã được nộp hoặc vừa được cập nhật. Hãy tải lại trang.");
    }
    const current = await tx.registration.findUniqueOrThrow({ where: { id: registration.id } });
    await tx.registrationStatusHistory.create({
      data: {
        registrationId: registration.id,
        fromStatus: registration.status,
        toStatus: "SUBMITTED",
        actorUserId: params.userId,
      },
    });
    if (registration.teamId) {
      await tx.teamInvitation.updateMany({
        where: { teamId: registration.teamId, status: "PENDING" },
        data: { status: "REVOKED" },
      });
    }
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
    await tx.notification.upsert({
      where: { id: `registration-submitted:${current.id}` },
      update: {},
      create: {
        id: `registration-submitted:${current.id}`,
        userId: params.userId,
        title: "Đã nhận hồ sơ đăng ký",
        body: `Hồ sơ ${current.code} đã được nộp thành công.`,
        href: "/dashboard/bien-nhan",
      },
    });
    await tx.idempotencyKey.create({
      data: {
        userId: params.userId,
        action: "registration.submit",
        key: params.idempotencyKey,
        responseJson: { ok: true, code: current.code },
      },
    });
    return { ok: true as const, code: current.code };
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
    await notifyUser({
      userId: registration.ownerUserId,
      title: "Hồ sơ cần cập nhật",
      body: `Ban Tổ chức yêu cầu cập nhật hồ sơ. Lý do: ${params.reason}`,
      href: "/dashboard/dang-ky",
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
