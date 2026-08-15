import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getUserRoles } from "@/server/services/auth-service";
import { LIVE_MATCH_STATUSES } from "@/server/domain/match-setup";
import type { Prisma } from "@prisma/client";

export async function disableUserAccount(params: {
  actorUserId: string;
  userId: string;
  reason: string;
}) {
  if (params.actorUserId === params.userId) {
    throw new Error("Không thể vô hiệu hóa tài khoản đang đăng nhập.");
  }
  const [actorRoles, targetRoles, target] = await Promise.all([
    getUserRoles(params.actorUserId),
    getUserRoles(params.userId),
    prisma.user.findUnique({ where: { id: params.userId } }),
  ]);
  if (!target || target.deletedAt) throw new Error("Không tìm thấy tài khoản, hoặc đã xóa.");
  if (targetRoles.includes("SUPER_ADMIN")) {
    throw new Error("Không được xóa tài khoản SUPER_ADMIN.");
  }
  if (targetRoles.includes("ADMIN") && !actorRoles.includes("SUPER_ADMIN")) {
    throw new Error("Chỉ SUPER_ADMIN mới vô hiệu hóa được ADMIN.");
  }
  await prisma.user.update({
    where: { id: target.id },
    data: { status: "DISABLED", deletedAt: new Date() },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "user.disable",
    entityType: "User",
    entityId: target.id,
    reason: params.reason,
    before: { email: target.email, status: target.status },
    after: { status: "DISABLED" },
  });
  return { email: target.email };
}

export async function removeTeamMember(params: {
  actorUserId: string;
  registrationId: string;
  userId: string;
  reason: string;
}) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.registrationId },
    include: { team: { include: { members: true } } },
  });
  if (!registration?.team) throw new Error("Hồ sơ này không phải đăng ký đội.");
  if (registration.ownerUserId === params.userId) {
    throw new Error("Không gỡ được chủ hồ sơ. Hãy vô hiệu hóa tài khoản hoặc xóa cả hồ sơ đăng ký.");
  }
  if (registration.team.leaderUserId === params.userId) {
    throw new Error("Không gỡ được nhóm trưởng. Đổi nhóm trưởng trước hoặc xóa hồ sơ.");
  }
  const member = registration.team.members.find((item) => item.userId === params.userId);
  if (!member) throw new Error("Thành viên không thuộc đội này.");
  await prisma.$transaction([
    prisma.teamMember.update({
      where: { id: member.id },
      data: { status: "REMOVED" },
    }),
    prisma.registrationSeat.deleteMany({
      where: { registrationId: registration.id, userId: params.userId },
    }),
  ]);
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: registration.competitionId,
    action: "team.remove_member",
    entityType: "TeamMember",
    entityId: member.id,
    reason: params.reason,
    after: { userId: params.userId, status: "REMOVED" },
  });
}

export async function deleteSubmission(params: {
  actorUserId: string;
  submissionId: string;
  reason: string;
}) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    include: { registration: true },
  });
  if (!submission || submission.deletedAt) throw new Error("Không tìm thấy bài nộp, hoặc đã xóa.");
  await prisma.submission.update({
    where: { id: submission.id },
    data: { deletedAt: new Date(), status: "WITHDRAWN", version: { increment: 1 } },
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: submission.competitionId,
    action: "submission.delete",
    entityType: "Submission",
    entityId: submission.id,
    reason: params.reason,
    before: { status: submission.status, code: submission.registration.code },
  });
  return { code: submission.registration.code };
}

export async function deleteRegistration(params: {
  actorUserId: string;
  registrationId: string;
  reason: string;
}) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.registrationId },
    include: { finalist: true, submissions: true },
  });
  if (!registration || registration.deletedAt) throw new Error("Không tìm thấy hồ sơ, hoặc đã xóa.");
  if (registration.finalist) {
    const live = await prisma.match.findFirst({
      where: {
        status: { in: [...LIVE_MATCH_STATUSES] },
        OR: [
          { competitorAId: registration.finalist.id },
          { competitorBId: registration.finalist.id },
        ],
      },
      select: { code: true },
    });
    if (live) {
      throw new Error(`Hồ sơ đang thi trận ${live.code}. Xóa/dừng trận trước.`);
    }
    const anyMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { competitorAId: registration.finalist.id },
          { competitorBId: registration.finalist.id },
          { winnerId: registration.finalist.id },
        ],
      },
      select: { code: true },
    });
    if (anyMatch) {
      throw new Error(`Hồ sơ còn gắn trận ${anyMatch.code}. Xóa trận trước khi xóa hồ sơ.`);
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.registrationSeat.deleteMany({ where: { registrationId: registration.id } });
    await tx.submission.updateMany({
      where: { registrationId: registration.id, deletedAt: null },
      data: { deletedAt: new Date(), status: "WITHDRAWN" },
    });
    if (registration.finalist) {
      await tx.finalist.delete({ where: { id: registration.finalist.id } });
    }
    await tx.registration.update({
      where: { id: registration.id },
      data: {
        deletedAt: new Date(),
        status: "WITHDRAWN",
        version: { increment: 1 },
        statusHistory: {
          create: {
            fromStatus: registration.status,
            toStatus: "WITHDRAWN",
            reason: params.reason,
            actorUserId: params.actorUserId,
          },
        },
      },
    });
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: registration.competitionId,
    action: "registration.delete",
    entityType: "Registration",
    entityId: registration.id,
    reason: params.reason,
    before: { code: registration.code, status: registration.status },
  });
  return { code: registration.code };
}

async function deleteReviewAssignments(
  tx: Prisma.TransactionClient,
  where: { reviewerId?: string; submissionId?: { in: string[] } },
) {
  const assignments = await tx.reviewAssignment.findMany({
    where,
    include: { review: true },
  });
  const reviewIds = assignments.map((item) => item.review?.id).filter((id): id is string => Boolean(id));
  if (reviewIds.length) {
    await tx.reviewScoreItem.deleteMany({ where: { reviewId: { in: reviewIds } } });
    await tx.review.deleteMany({ where: { id: { in: reviewIds } } });
  }
  if (assignments.length) {
    await tx.reviewAssignment.deleteMany({ where: { id: { in: assignments.map((item) => item.id) } } });
  }
}

async function deleteJudgeWork(tx: Prisma.TransactionClient, judgeId: string) {
  const assignments = await tx.judgeAssignment.findMany({
    where: { judgeId },
    select: { id: true },
  });
  const assignmentIds = assignments.map((item) => item.id);
  if (assignmentIds.length) {
    const scores = await tx.judgeScore.findMany({
      where: { assignmentId: { in: assignmentIds } },
      select: { id: true },
    });
    const scoreIds = scores.map((item) => item.id);
    if (scoreIds.length) {
      await tx.judgeScoreItem.deleteMany({ where: { judgeScoreId: { in: scoreIds } } });
      await tx.judgeScore.deleteMany({ where: { id: { in: scoreIds } } });
    }
    await tx.judgeAssignment.deleteMany({ where: { id: { in: assignmentIds } } });
  }
}

async function hardDeleteOwnedRegistration(tx: Prisma.TransactionClient, registrationId: string) {
  const registration = await tx.registration.findUniqueOrThrow({
    where: { id: registrationId },
    include: { finalist: true, submissions: true, team: true },
  });
  if (registration.finalist) {
    const match = await tx.match.findFirst({
      where: {
        OR: [
          { competitorAId: registration.finalist.id },
          { competitorBId: registration.finalist.id },
          { winnerId: registration.finalist.id },
        ],
      },
      select: { code: true },
    });
    if (match) {
      throw new Error(`Tài khoản còn gắn trận ${match.code}. Xóa trận trước khi xóa user.`);
    }
  }
  const submissionIds = registration.submissions.map((item) => item.id);
  if (submissionIds.length) {
    await deleteReviewAssignments(tx, { submissionId: { in: submissionIds } });
    await tx.deadlineOverride.deleteMany({ where: { submissionId: { in: submissionIds } } });
    await tx.submission.updateMany({
      where: { id: { in: submissionIds } },
      data: { currentVersionId: null },
    });
    await tx.submissionVersion.deleteMany({ where: { submissionId: { in: submissionIds } } });
    await tx.submission.deleteMany({ where: { id: { in: submissionIds } } });
  }
  if (registration.finalist) {
    await tx.finalist.delete({ where: { id: registration.finalist.id } });
  }
  await tx.registrationSeat.deleteMany({ where: { registrationId } });
  await tx.internalNote.deleteMany({ where: { registrationId } });
  await tx.entityTag.deleteMany({ where: { registrationId } });
  await tx.deadlineOverride.deleteMany({ where: { registrationId } });
  await tx.registrationStatusHistory.deleteMany({ where: { registrationId } });
  await tx.registration.delete({ where: { id: registrationId } });
  if (registration.teamId) {
    await tx.teamInvitation.deleteMany({ where: { teamId: registration.teamId } });
    await tx.teamMember.deleteMany({ where: { teamId: registration.teamId } });
    await tx.team.delete({ where: { id: registration.teamId } });
  }
}

export async function hardDeleteUser(params: {
  actorUserId: string;
  userId: string;
  reason: string;
}) {
  if (params.actorUserId === params.userId) {
    throw new Error("Không thể xóa tài khoản đang đăng nhập.");
  }
  const [actorRoles, targetRoles, target] = await Promise.all([
    getUserRoles(params.actorUserId),
    getUserRoles(params.userId),
    prisma.user.findUnique({ where: { id: params.userId } }),
  ]);
  if (!target) throw new Error("Không tìm thấy tài khoản.");
  if (targetRoles.includes("SUPER_ADMIN")) {
    throw new Error("Không được xóa tài khoản SUPER_ADMIN.");
  }
  if (targetRoles.includes("ADMIN") && !actorRoles.includes("SUPER_ADMIN")) {
    throw new Error("Chỉ SUPER_ADMIN mới xóa được ADMIN.");
  }

  const owned = await prisma.registration.findMany({
    where: { ownerUserId: target.id },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const row of owned) {
      await hardDeleteOwnedRegistration(tx, row.id);
    }
    await deleteJudgeWork(tx, target.id);
    await deleteReviewAssignments(tx, { reviewerId: target.id });
    await tx.registrationSeat.deleteMany({ where: { userId: target.id } });
    await tx.teamMember.deleteMany({ where: { userId: target.id } });
    await tx.teamInvitation.deleteMany({ where: { invitedById: target.id } });
    await tx.teamInvitation.updateMany({ where: { inviteeId: target.id }, data: { inviteeId: null } });
    const leftoverTeams = await tx.team.findMany({ where: { leaderUserId: target.id }, select: { id: true } });
    for (const team of leftoverTeams) {
      await tx.teamInvitation.deleteMany({ where: { teamId: team.id } });
      await tx.teamMember.deleteMany({ where: { teamId: team.id } });
      await tx.team.delete({ where: { id: team.id } });
    }
    await tx.notification.deleteMany({ where: { userId: target.id } });
    await tx.consentRecord.deleteMany({ where: { userId: target.id } });
    await tx.loginEvent.deleteMany({ where: { userId: target.id } });
    await tx.staffInvitation.deleteMany({ where: { invitedById: target.id } });
    await tx.staffInvitation.updateMany({ where: { userId: target.id }, data: { userId: null } });
    await tx.incident.deleteMany({ where: { reporterId: target.id } });
    await tx.internalNote.deleteMany({ where: { authorId: target.id } });
    await tx.deadlineOverride.deleteMany({ where: { grantedById: target.id } });
    await tx.fileAsset.updateMany({ where: { ownerUserId: target.id }, data: { ownerUserId: null } });
    await tx.participantProfile.deleteMany({ where: { userId: target.id } });
    await tx.roleAssignment.deleteMany({ where: { userId: target.id } });
    await tx.verificationToken.deleteMany({ where: { userId: target.id } });
    await tx.passwordResetToken.deleteMany({ where: { userId: target.id } });
    await tx.idempotencyKey.deleteMany({ where: { userId: target.id } });
    await tx.auditLog.updateMany({ where: { actorUserId: target.id }, data: { actorUserId: null } });
    await tx.user.delete({ where: { id: target.id } });
  });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    action: "user.hard_delete",
    entityType: "User",
    entityId: target.id,
    reason: params.reason,
    before: { email: target.email, roles: targetRoles },
  });
  return { email: target.email };
}