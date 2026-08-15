import { prisma } from "@/lib/db/prisma";
import { requireProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration } from "@/server/services/registration-service";
import { isDeadlinePassed } from "@/server/domain/deadlines";
import { validateSubmissionRequiredFields } from "@/server/domain/submission-rules";
import { assertTransition, SUBMISSION_TRANSITIONS } from "@/server/domain/status-transitions";
import { enqueueEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { formatDateTime } from "@/lib/dates";

const draftDefaults = {
  submissionTitle: "",
  problemStatement: "",
  targetUsers: "",
  solutionSummary: "",
  expectedImpact: "",
  geminiUsageSummary: "",
  promptingProcessSummary: "",
  technicalApproach: "",
  originalityDeclaration: false,
  permissionToReviewPrivateLinks: false,
};

export async function getOrCreateAudition(userId: string) {
  const competition = await requireProductionCompetition();
  const registration = await getMyRegistration(userId, competition.id);
  if (!registration) throw new Error("Bạn cần hoàn tất đăng ký trước khi nộp Audition.");
  if (!["SUBMITTED", "ELIGIBLE", "UNDER_REVIEW", "SELECTED", "LOCKED", "NEEDS_UPDATE"].includes(registration.status)) {
    throw new Error("Hồ sơ đăng ký chưa ở trạng thái được phép nộp bài.");
  }
  let submission = await prisma.submission.findFirst({
    where: { registrationId: registration.id, deletedAt: null },
    include: { currentVersion: true, versions: { orderBy: { versionNumber: "desc" } } },
  });
  if (!submission) {
    submission = await prisma.$transaction(async (tx) => {
      const created = await tx.submission.create({
        data: {
          competitionId: competition.id,
          registrationId: registration.id,
          status: "DRAFT",
        },
      });
      const version = await tx.submissionVersion.create({
        data: { submissionId: created.id, versionNumber: 1, ...draftDefaults },
      });
      return tx.submission.update({
        where: { id: created.id },
        data: { currentVersionId: version.id },
        include: { currentVersion: true, versions: true },
      });
    });
  }
  return { competition, registration, submission };
}

export async function autosaveAudition(params: {
  userId: string;
  data: Record<string, unknown>;
}) {
  const { competition, submission } = await getOrCreateAudition(params.userId);
  if (!submission.currentVersionId || submission.currentVersion?.isImmutable) {
    throw new Error("Phiên bản hiện tại đã khóa.");
  }
  if (["LOCKED", "SUBMITTED", "UNDER_REVIEW", "SCORED"].includes(submission.status) && !competition.settings.allowEditAfterSubmit) {
    throw new Error("Bài đã nộp và không còn được chỉnh sửa.");
  }
  const allowed = [
    "submissionTitle",
    "problemStatement",
    "targetUsers",
    "solutionSummary",
    "expectedImpact",
    "geminiUsageSummary",
    "promptingProcessSummary",
    "technicalApproach",
    "introVideoUrl",
    "deployedDemoUrl",
    "repositoryUrl",
    "designOrSlideUrl",
    "additionalNotes",
    "originalityDeclaration",
    "permissionToReviewPrivateLinks",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in params.data) data[key] = params.data[key];
  }
  await prisma.submissionVersion.update({
    where: { id: submission.currentVersionId },
    data,
  });
  await prisma.submission.update({
    where: { id: submission.id },
    data: { lastAutosavedAt: new Date() },
  });
}

export async function submitAudition(params: { userId: string; idempotencyKey: string }) {
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: {
      userId_action_key: {
        userId: params.userId,
        action: "submission.submit",
        key: params.idempotencyKey,
      },
    },
  });
  if (existingKey?.responseJson) return existingKey.responseJson as { ok: true; id: string };
  const { competition, registration, submission } = await getOrCreateAudition(params.userId);
  if (registration.ownerUserId !== params.userId) {
    throw new Error("Chỉ nhóm trưởng được nộp bài.");
  }
  const override = await prisma.deadlineOverride.findFirst({
    where: { submissionId: submission.id, kind: "submission" },
    orderBy: { createdAt: "desc" },
  });
  if (
    isDeadlinePassed({
      now: new Date(),
      closeAt: competition.settings.submissionCloseAt,
      overrideDeadline: override?.newDeadline,
    }) ||
    !competition.settings.submissionEnabled
  ) {
    throw new Error("Đã hết hạn nộp bài hoặc cổng nộp đang đóng.");
  }
  const version = submission.currentVersion;
  if (!version) throw new Error("Thiếu phiên bản bài nộp.");
  const errors = validateSubmissionRequiredFields(version, competition.settings);
  if (errors.length) throw new Error(errors.join(" "));
  assertTransition(SUBMISSION_TRANSITIONS, submission.status, "SUBMITTED", "submission");
  const submittedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.submissionVersion.update({
      where: { id: version.id },
      data: { isImmutable: true },
    });
    await tx.submission.update({
      where: { id: submission.id, version: submission.version },
      data: {
        status: "SUBMITTED",
        submittedAt,
        confirmationEmailKey: submission.confirmationEmailKey ?? `sub:${submission.id}`,
        version: { increment: 1 },
      },
    });
    await tx.idempotencyKey.create({
      data: {
        userId: params.userId,
        action: "submission.submit",
        key: params.idempotencyKey,
        responseJson: { ok: true, id: submission.id },
      },
    });
  });
  const owner = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  await enqueueEmail({
    toEmail: owner.email,
    templateCode: "submission_confirm",
    payload: { submittedAt: formatDateTime(submittedAt) },
    idempotencyKey: `submission_confirm:${submission.id}`,
  });
  await writeAuditLog({
    actorUserId: params.userId,
    competitionId: competition.id,
    action: "submission.submit",
    entityType: "Submission",
    entityId: submission.id,
  });
  return { ok: true as const, id: submission.id };
}
