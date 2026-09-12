import { prisma } from "@/lib/db/prisma";
import { requireProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration } from "@/server/services/registration-service";
import { isDeadlinePassed } from "@/server/domain/deadlines";
import {
  buildAutosaveData,
  editableSubmissionStatuses,
  isSubmissionEditable,
  type AuditionFormPayload,
} from "@/server/domain/audition-form";
import { validateSubmissionRequiredFields } from "@/server/domain/submission-rules";
import { assertTransition, SUBMISSION_TRANSITIONS } from "@/server/domain/status-transitions";
import { writeAuditLog } from "@/lib/audit";

export type SubmitAuditionResult =
  | { ok: true; id: string; status: "SUBMITTED"; alreadySubmitted?: boolean }
  | { ok: false; message: string };

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
  data: AuditionFormPayload | Record<string, unknown>;
}) {
  const { competition, submission } = await getOrCreateAudition(params.userId);
  if (!submission.currentVersionId || submission.currentVersion?.isImmutable) {
    return { ok: true as const, skipped: true as const };
  }
  if (!isSubmissionEditable(submission.status, competition.settings.allowEditAfterSubmit)) {
    return { ok: true as const, skipped: true as const };
  }
  const data = buildAutosaveData(params.data as AuditionFormPayload);
  const updated = await prisma.submissionVersion.updateMany({
    where: {
      id: submission.currentVersionId,
      isImmutable: false,
      submission: {
        id: submission.id,
        deletedAt: null,
        status: { in: editableSubmissionStatuses(competition.settings.allowEditAfterSubmit) },
      },
    },
    data,
  });
  if (updated.count === 0) {
    return { ok: true as const, skipped: true as const };
  }
  await prisma.submission.update({
    where: { id: submission.id },
    data: { lastAutosavedAt: new Date() },
  });
  return { ok: true as const, skipped: false as const };
}

export async function submitAudition(params: {
  userId: string;
  idempotencyKey: string;
  draft?: AuditionFormPayload;
}): Promise<SubmitAuditionResult> {
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: {
      userId_action_key: {
        userId: params.userId,
        action: "submission.submit",
        key: params.idempotencyKey,
      },
    },
  });
  if (existingKey?.responseJson) {
    return existingKey.responseJson as SubmitAuditionResult;
  }
  const { competition, registration, submission } = await getOrCreateAudition(params.userId);
  if (registration.ownerUserId !== params.userId) {
    throw new Error("Chỉ nhóm trưởng được nộp bài.");
  }
  if (submission.status === "SUBMITTED") {
    const response: SubmitAuditionResult = {
      ok: true,
      id: submission.id,
      status: "SUBMITTED",
      alreadySubmitted: true,
    };
    await prisma.idempotencyKey.upsert({
      where: {
        userId_action_key: {
          userId: params.userId,
          action: "submission.submit",
          key: params.idempotencyKey,
        },
      },
      update: { responseJson: response },
      create: {
        userId: params.userId,
        action: "submission.submit",
        key: params.idempotencyKey,
        responseJson: response,
      },
    });
    return response;
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
  if (params.draft) {
    await autosaveAudition({ userId: params.userId, data: params.draft });
  }
  const refreshed = await getOrCreateAudition(params.userId);
  const version = refreshed.submission.currentVersion;
  if (!version || !refreshed.submission.currentVersionId) {
    throw new Error("Thiếu phiên bản bài nộp.");
  }
  if (refreshed.submission.status === "SUBMITTED") {
    const response: SubmitAuditionResult = {
      ok: true,
      id: refreshed.submission.id,
      status: "SUBMITTED",
      alreadySubmitted: true,
    };
    await prisma.idempotencyKey.upsert({
      where: {
        userId_action_key: {
          userId: params.userId,
          action: "submission.submit",
          key: params.idempotencyKey,
        },
      },
      update: { responseJson: response },
      create: {
        userId: params.userId,
        action: "submission.submit",
        key: params.idempotencyKey,
        responseJson: response,
      },
    });
    return response;
  }
  const errors = validateSubmissionRequiredFields(version, competition.settings);
  if (errors.length) throw new Error(errors.join(" "));
  assertTransition(SUBMISSION_TRANSITIONS, refreshed.submission.status, "SUBMITTED", "submission");
  const submittedAt = new Date();
  const response: SubmitAuditionResult = {
    ok: true,
    id: refreshed.submission.id,
    status: "SUBMITTED",
  };
  const transitioned = await prisma.$transaction(async (tx) => {
    const lockedVersion = await tx.submissionVersion.updateMany({
      where: {
        id: version.id,
        isImmutable: false,
        submission: {
          id: refreshed.submission.id,
          status: "DRAFT",
          version: refreshed.submission.version,
          deletedAt: null,
        },
      },
      data: { isImmutable: true },
    });
    if (lockedVersion.count === 0) {
      const current = await tx.submission.findUnique({ where: { id: refreshed.submission.id } });
      return current?.status === "SUBMITTED";
    }
    const updatedSubmission = await tx.submission.updateMany({
      where: {
        id: refreshed.submission.id,
        status: "DRAFT",
        version: refreshed.submission.version,
      },
      data: {
        status: "SUBMITTED",
        submittedAt,
        version: { increment: 1 },
      },
    });
    if (updatedSubmission.count === 0) {
      const current = await tx.submission.findUnique({ where: { id: refreshed.submission.id } });
      return current?.status === "SUBMITTED";
    }
    await tx.idempotencyKey.create({
      data: {
        userId: params.userId,
        action: "submission.submit",
        key: params.idempotencyKey,
        responseJson: response,
      },
    });
    await tx.notification.upsert({
      where: { id: `submission-submitted:${refreshed.submission.id}` },
      update: {},
      create: {
        id: `submission-submitted:${refreshed.submission.id}`,
        userId: params.userId,
        title: "Đã nhận bài Audition",
        body: "Bài Audition của bạn đã được nộp thành công.",
        href: "/dashboard/bien-nhan",
      },
    });
    return true;
  });
  if (!transitioned) {
    const current = await prisma.submission.findUnique({ where: { id: refreshed.submission.id } });
    if (current?.status === "SUBMITTED") {
      return { ok: true, id: refreshed.submission.id, status: "SUBMITTED", alreadySubmitted: true };
    }
    throw new Error("Không thể nộp bài. Vui lòng thử lại.");
  }
  await writeAuditLog({
    actorUserId: params.userId,
    competitionId: competition.id,
    action: "submission.submit",
    entityType: "Submission",
    entityId: refreshed.submission.id,
  });
  return response;
}
