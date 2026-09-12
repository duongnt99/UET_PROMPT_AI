import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { aggregateScores, normalizeCriterionScore, rubricWeightsSumTo100 } from "@/server/domain/scoring";
import {
  assertValidReviewDraftItems,
  canStartResubmit,
  computeReviewTotalNormalized,
  getActiveDraftReview,
  getLatestSubmittedReview,
  hasSubmissionAttemptsRemaining,
  resolveReviewSubmissionLimit,
  ReviewValidationError,
} from "@/server/domain/review-scoring";
import { parseCompetitionSettings } from "@/config/competition-settings";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

type ReviewItemInput = { criterionId: string; rawScore: string; comment?: string };

type ReviewWithItems = {
  id: string;
  attemptNumber: number;
  status: "DRAFT" | "SUBMITTED";
  overallComment: string;
  totalNormalized: Decimal;
  submittedAt: Date | null;
  items: Array<{
    criterionId: string;
    rawScore: Decimal;
    normalizedScore: Decimal;
    comment: string;
  }>;
};

function mapCriterionRules(
  criteria: Array<{
    id: string;
    titleVi: string;
    minScore: Decimal;
    maxScore: Decimal;
    scoreStep: Decimal;
    weight: Decimal;
  }>,
) {
  return criteria.map((criterion) => ({
    id: criterion.id,
    titleVi: criterion.titleVi,
    minScore: criterion.minScore.toString(),
    maxScore: criterion.maxScore.toString(),
    scoreStep: criterion.scoreStep.toString(),
    weight: criterion.weight.toString(),
  }));
}

async function getAssignmentForReviewer(assignmentId: string) {
  return prisma.reviewAssignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      rubric: { include: { criteria: { orderBy: { displayOrder: "asc" } } } },
      reviews: {
        include: { items: true },
        orderBy: { attemptNumber: "asc" },
      },
      competition: true,
      submission: { select: { reviewSubmissionLimit: true } },
    },
  });
}

function reviewSubmissionLimitForAssignment(assignment: {
  submission: { reviewSubmissionLimit: number | null };
  competition: { settings: unknown };
}) {
  const settings = parseCompetitionSettings(assignment.competition.settings);
  return resolveReviewSubmissionLimit(assignment.submission.reviewSubmissionLimit, settings.reviewSubmissionLimit);
}

async function lockReviewAssignment(tx: Prisma.TransactionClient, assignmentId: string) {
  await tx.$executeRaw`SELECT id FROM "ReviewAssignment" WHERE id = ${assignmentId} FOR UPDATE`;
}

async function loadAssignmentReviews(
  tx: Prisma.TransactionClient,
  assignmentId: string,
): Promise<ReviewWithItems[]> {
  return tx.review.findMany({
    where: { assignmentId },
    include: { items: true },
    orderBy: { attemptNumber: "asc" },
  });
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getOrCreateActiveDraftReview(
  tx: Prisma.TransactionClient,
  assignment: {
    id: string;
    status: string;
    reviews: ReviewWithItems[];
  },
) {
  const existingDraft = getActiveDraftReview(assignment.reviews);
  if (existingDraft) return existingDraft;

  if (assignment.status === "LOCKED") {
    throw new Error("Đánh giá đã bị khóa.");
  }

  const nextAttemptNumber =
    assignment.reviews.reduce((max, review) => Math.max(max, review.attemptNumber), 0) + 1;
  const latestSubmitted = getLatestSubmittedReview(assignment.reviews);

  try {
    const created = await tx.review.create({
      data: {
        assignmentId: assignment.id,
        attemptNumber: nextAttemptNumber,
        status: "DRAFT",
        overallComment: latestSubmitted?.overallComment ?? "",
        totalNormalized: latestSubmitted?.totalNormalized ?? new Decimal(0),
      },
      include: { items: true },
    });

    if (latestSubmitted) {
      await tx.reviewScoreItem.createMany({
        data: latestSubmitted.items.map((item) => ({
          reviewId: created.id,
          criterionId: item.criterionId,
          rawScore: item.rawScore,
          normalizedScore: item.normalizedScore,
          comment: item.comment,
        })),
      });
      const refreshed = await tx.review.findUniqueOrThrow({
        where: { id: created.id },
        include: { items: true },
      });
      return refreshed;
    }

    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const afterRace = await loadAssignmentReviews(tx, assignment.id);
      const draft = getActiveDraftReview(afterRace);
      if (draft) return draft;
    }
    throw error;
  }
}

export async function getActiveRubric(competitionId: string, stage: "AUDITION" | "FINAL") {
  return prisma.rubric.findFirst({
    where: { competitionId, stage, isActive: true },
    include: { criteria: { orderBy: { displayOrder: "asc" } } },
  });
}

export async function autoAssignReviewers(params: {
  actorUserId: string;
  competitionId: string;
  reviewersPerSubmission: number;
}) {
  const rubric = await getActiveRubric(params.competitionId, "AUDITION");
  if (!rubric) throw new Error("Chưa có rubric Audition đang kích hoạt.");
  const submissions = await prisma.submission.findMany({
    where: { competitionId: params.competitionId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    include: { currentVersion: true, reviews: true },
  });
  const reviewers = await prisma.roleAssignment.findMany({
    where: { role: "REVIEWER", revokedAt: null },
    include: { user: true },
  });
  const loads = new Map(reviewers.map((item) => [item.userId, 0]));
  for (const submission of submissions) {
    if (!submission.currentVersionId) continue;
    const needed = params.reviewersPerSubmission - submission.reviews.filter((r) => r.status !== "DECLINED").length;
    const ranked = [...loads.entries()].sort((a, b) => a[1] - b[1]);
    let assigned = 0;
    for (const [reviewerId] of ranked) {
      if (assigned >= needed) break;
      if (submission.reviews.some((r) => r.reviewerId === reviewerId)) continue;
      await prisma.reviewAssignment.create({
        data: {
          competitionId: params.competitionId,
          submissionId: submission.id,
          submissionVersionId: submission.currentVersionId,
          reviewerId,
          rubricId: rubric.id,
          status: "ASSIGNED",
        },
      });
      loads.set(reviewerId, (loads.get(reviewerId) ?? 0) + 1);
      assigned += 1;
    }
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "UNDER_REVIEW" },
    });
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: params.competitionId,
    action: "review.auto_assign",
    entityType: "Competition",
    entityId: params.competitionId,
  });
}

export async function saveReviewDraft(params: {
  reviewerId: string;
  assignmentId: string;
  overallComment: string;
  recommendation?: "STRONG_YES" | "YES" | "MAYBE" | "NO";
  items: ReviewItemInput[];
}) {
  const assignment = await getAssignmentForReviewer(params.assignmentId);
  if (assignment.reviewerId !== params.reviewerId) {
    throw new Error("Không có quyền với bài được phân công.");
  }
  if (assignment.status === "LOCKED") {
    throw new Error("Đánh giá đã bị khóa.");
  }
  if (assignment.status === "SUBMITTED" && !getActiveDraftReview(assignment.reviews)) {
    throw new Error("Đánh giá đã nộp. Bấm Chấm lại nếu còn lượt nộp.");
  }

  const criteria = mapCriterionRules(assignment.rubric.criteria);
  const weights = assignment.rubric.criteria.map((c) => c.weight.toString());
  if (!rubricWeightsSumTo100(weights)) {
    throw new Error("Rubric không hợp lệ: tổng trọng số phải bằng 100%.");
  }
  assertValidReviewDraftItems(params.items, criteria);
  const total = computeReviewTotalNormalized(params.items, criteria);

  const normalizedItems = params.items.map((item) => {
    const criterion = criteria.find((entry) => entry.id === item.criterionId);
    if (!criterion) throw new ReviewValidationError("Tiêu chí không thuộc rubric.", []);
    const normalizedScore = normalizeCriterionScore({
      rawScore: item.rawScore.trim(),
      minScore: criterion.minScore,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
    });
    return {
      criterionId: item.criterionId,
      rawScore: item.rawScore.trim(),
      normalizedScore: normalizedScore.toString(),
      comment: item.comment ?? "",
    };
  });

  const savedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await lockReviewAssignment(tx, assignment.id);
    const freshReviews = await loadAssignmentReviews(tx, assignment.id);
    const draft = await getOrCreateActiveDraftReview(tx, { ...assignment, reviews: freshReviews });
    await tx.review.update({
      where: { id: draft.id, status: "DRAFT" },
      data: {
        overallComment: params.overallComment,
        recommendation: params.recommendation,
        totalNormalized: total,
      },
    });
    await tx.reviewScoreItem.deleteMany({ where: { reviewId: draft.id } });
    await tx.reviewScoreItem.createMany({
      data: normalizedItems.map((item) => ({
        reviewId: draft.id,
        criterionId: item.criterionId,
        rawScore: item.rawScore,
        normalizedScore: item.normalizedScore,
        comment: item.comment,
      })),
    });
    await tx.reviewAssignment.update({
      where: { id: assignment.id },
      data: { status: "DRAFT" },
    });
  });

  return { ok: true as const, savedAt: savedAt.toISOString() };
}

export async function startReviewResubmit(params: { reviewerId: string; assignmentId: string }) {
  const assignment = await getAssignmentForReviewer(params.assignmentId);
  if (assignment.reviewerId !== params.reviewerId) {
    throw new Error("Không có quyền với bài được phân công.");
  }

  const result = await prisma.$transaction(async (tx) => {
    await lockReviewAssignment(tx, assignment.id);
    const reviews = await loadAssignmentReviews(tx, assignment.id);
    const existingDraft = getActiveDraftReview(reviews);
    if (existingDraft) {
      return { reused: true as const };
    }

    const lockedAssignment = await tx.reviewAssignment.findUniqueOrThrow({
      where: { id: assignment.id },
      include: { competition: true, submission: { select: { reviewSubmissionLimit: true } } },
    });
    if (lockedAssignment.status === "LOCKED") {
      throw new Error("Đánh giá đã bị khóa.");
    }
    const submissionLimit = reviewSubmissionLimitForAssignment(lockedAssignment);
    if (!canStartResubmit(lockedAssignment.submittedAttemptCount, submissionLimit)) {
      throw new Error("Đã dùng hết số lượt nộp đánh giá.");
    }
    const latestSubmitted = getLatestSubmittedReview(reviews);
    if (!latestSubmitted) {
      throw new Error("Chưa có đánh giá đã nộp để chấm lại.");
    }

    const nextAttemptNumber = latestSubmitted.attemptNumber + 1;
    try {
      const created = await tx.review.create({
        data: {
          assignmentId: assignment.id,
          attemptNumber: nextAttemptNumber,
          status: "DRAFT",
          overallComment: latestSubmitted.overallComment,
          totalNormalized: latestSubmitted.totalNormalized,
        },
      });
      await tx.reviewScoreItem.createMany({
        data: latestSubmitted.items.map((item) => ({
          reviewId: created.id,
          criterionId: item.criterionId,
          rawScore: item.rawScore,
          normalizedScore: item.normalizedScore,
          comment: item.comment,
        })),
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const afterRace = await loadAssignmentReviews(tx, assignment.id);
        if (getActiveDraftReview(afterRace)) {
          return { reused: true as const };
        }
      }
      throw error;
    }

    await tx.reviewAssignment.update({
      where: { id: assignment.id },
      data: { status: "DRAFT" },
    });
    return { reused: false as const };
  });

  if (!result.reused) {
    await writeAuditLog({
      actorUserId: params.reviewerId,
      competitionId: assignment.competitionId,
      action: "review.resubmit_start",
      entityType: "ReviewAssignment",
      entityId: assignment.id,
    });
  }

  return { ok: true as const, reused: result.reused };
}

export async function submitReview(params: {
  reviewerId: string;
  assignmentId: string;
  draft?: {
    overallComment: string;
    recommendation?: "STRONG_YES" | "YES" | "MAYBE" | "NO";
    items: ReviewItemInput[];
  };
}) {
  if (params.draft) {
    await saveReviewDraft({
      reviewerId: params.reviewerId,
      assignmentId: params.assignmentId,
      overallComment: params.draft.overallComment,
      recommendation: params.draft.recommendation,
      items: params.draft.items,
    });
  }

  const assignment = await getAssignmentForReviewer(params.assignmentId);
  if (assignment.reviewerId !== params.reviewerId) {
    throw new Error("Không có quyền.");
  }

  const submittedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    await lockReviewAssignment(tx, assignment.id);
    const lockedAssignment = await tx.reviewAssignment.findUniqueOrThrow({
      where: { id: assignment.id },
      include: {
        rubric: { include: { criteria: { orderBy: { displayOrder: "asc" } } } },
        reviews: { include: { items: true }, orderBy: { attemptNumber: "asc" } },
        competition: true,
        submission: { select: { reviewSubmissionLimit: true } },
      },
    });
    if (lockedAssignment.reviewerId !== params.reviewerId) {
      throw new Error("Không có quyền.");
    }
    if (lockedAssignment.status === "LOCKED") {
      throw new Error("Đánh giá đã bị khóa.");
    }

    const submissionLimit = reviewSubmissionLimitForAssignment(lockedAssignment);
    if (!hasSubmissionAttemptsRemaining(lockedAssignment.submittedAttemptCount, submissionLimit)) {
      throw new Error("Đã dùng hết số lượt nộp đánh giá.");
    }

    const draft = getActiveDraftReview(lockedAssignment.reviews);
    if (!draft || draft.items.length !== lockedAssignment.rubric.criteria.length) {
      throw new Error("Cần chấm đủ các tiêu chí trước khi nộp.");
    }

    const criteria = mapCriterionRules(lockedAssignment.rubric.criteria);
    assertValidReviewDraftItems(
      draft.items.map((item) => ({ criterionId: item.criterionId, rawScore: item.rawScore.toString() })),
      criteria,
    );

    const nextSubmittedAttemptCount = lockedAssignment.submittedAttemptCount + 1;
    const assignmentUpdate = await tx.reviewAssignment.updateMany({
      where: {
        id: lockedAssignment.id,
        version: lockedAssignment.version,
        submittedAttemptCount: lockedAssignment.submittedAttemptCount,
        status: { not: "LOCKED" },
      },
      data: {
        status: "SUBMITTED",
        submittedAt,
        submittedAttemptCount: nextSubmittedAttemptCount,
        version: { increment: 1 },
      },
    });
    if (assignmentUpdate.count === 0) {
      throw new Error("Trạng thái đánh giá đã thay đổi, tải lại trang.");
    }

    const reviewUpdate = await tx.review.updateMany({
      where: { id: draft.id, status: "DRAFT" },
      data: {
        status: "SUBMITTED",
        submittedAt,
        version: { increment: 1 },
      },
    });
    if (reviewUpdate.count === 0) {
      throw new Error("Bản nháp đã thay đổi, tải lại trang.");
    }

    return nextSubmittedAttemptCount;
  });

  await writeAuditLog({
    actorUserId: params.reviewerId,
    competitionId: assignment.competitionId,
    action: updated > 1 ? "review.resubmit" : "review.submit",
    entityType: "ReviewAssignment",
    entityId: assignment.id,
    after: { submittedAttemptCount: updated },
  });

  return { ok: true as const, submittedAttemptCount: updated };
}

export function getCanonicalReviewForAssignment(reviews: ReviewWithItems[]) {
  return getLatestSubmittedReview(reviews) ?? getActiveDraftReview(reviews);
}

export async function rankSubmissions(competitionId: string) {
  const submissions = await prisma.submission.findMany({
    where: { competitionId, status: { in: ["UNDER_REVIEW", "SCORED", "SUBMITTED", "LOCKED"] } },
    include: {
      registration: true,
      reviews: {
        include: {
          reviews: { include: { items: true }, orderBy: { attemptNumber: "asc" } },
        },
      },
    },
  });
  return submissions
    .map((submission) => {
      const submittedAssignments = submission.reviews.filter((item) => item.submittedAttemptCount > 0);
      const canonicalTotals = submittedAssignments
        .map((item) => getLatestSubmittedReview(item.reviews)?.totalNormalized?.toString())
        .filter((value): value is string => Boolean(value));
      const aggregate =
        canonicalTotals.length > 0 ? aggregateScores(canonicalTotals) : null;
      return {
        submissionId: submission.id,
        registrationId: submission.registrationId,
        code: submission.registration.code,
        completedReviews: submittedAssignments.length,
        assignedReviews: submission.reviews.length,
        aggregate: aggregate?.toString() ?? null,
        incomplete: submittedAssignments.length === 0,
      };
    })
    .sort((a, b) => Number(b.aggregate ?? -1) - Number(a.aggregate ?? -1));
}

export async function assignReviewerManually(params: {
  actorUserId: string;
  submissionId: string;
  reviewerId: string;
}) {
  const submission = await prisma.submission.findUnique({
    where: { id: params.submissionId },
    include: { registration: true, reviews: true },
  });
  if (!submission || submission.deletedAt) throw new Error("Không tìm thấy bài nộp.");
  if (!submission.currentVersionId) throw new Error("Bài chưa có phiên bản để chấm.");
  if (["WITHDRAWN"].includes(submission.status)) throw new Error("Bài đã rút, không gán chấm được.");
  const reviewer = await prisma.user.findUnique({
    where: { id: params.reviewerId },
    include: { roleAssignments: { where: { role: "REVIEWER", revokedAt: null } } },
  });
  if (!reviewer || reviewer.deletedAt || reviewer.status === "DISABLED" || !reviewer.roleAssignments.length) {
    throw new Error("Tài khoản không phải reviewer đang hiệu lực.");
  }
  if (submission.reviews.some((item) => item.reviewerId === reviewer.id && item.status !== "DECLINED")) {
    throw new Error("Reviewer này đã được gán bài của đội đó.");
  }
  const rubric = await getActiveRubric(submission.competitionId, "AUDITION");
  if (!rubric) throw new Error("Chưa có rubric Audition đang kích hoạt.");
  const assignment = await prisma.reviewAssignment.create({
    data: {
      competitionId: submission.competitionId,
      submissionId: submission.id,
      submissionVersionId: submission.currentVersionId,
      reviewerId: reviewer.id,
      rubricId: rubric.id,
      status: "ASSIGNED",
    },
  });
  if (["DRAFT", "SUBMITTED"].includes(submission.status)) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "UNDER_REVIEW" },
    });
  }
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: submission.competitionId,
    action: "review.manual_assign",
    entityType: "ReviewAssignment",
    entityId: assignment.id,
    after: { reviewerId: reviewer.id, registrationCode: submission.registration.code },
  });
  return { code: submission.registration.code, reviewerEmail: reviewer.email };
}

export async function unassignReviewer(params: { actorUserId: string; assignmentId: string }) {
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id: params.assignmentId },
    include: { reviews: true, submission: { include: { registration: true } } },
  });
  if (!assignment) throw new Error("Không tìm thấy phân công.");
  if (assignment.submittedAttemptCount > 0 || assignment.status === "LOCKED") {
    throw new Error("Reviewer đã nộp phiếu. Không gỡ được — cần SUPER_ADMIN mở lại nếu có sự cố.");
  }
  await prisma.$transaction(async (tx) => {
    const reviewIds = assignment.reviews.map((review) => review.id);
    if (reviewIds.length > 0) {
      await tx.reviewScoreItem.deleteMany({ where: { reviewId: { in: reviewIds } } });
      await tx.review.deleteMany({ where: { id: { in: reviewIds } } });
    }
    await tx.reviewAssignment.delete({ where: { id: assignment.id } });
  });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: assignment.competitionId,
    action: "review.unassign",
    entityType: "ReviewAssignment",
    entityId: assignment.id,
    after: { registrationCode: assignment.submission.registration.code },
  });
  return { code: assignment.submission.registration.code };
}
