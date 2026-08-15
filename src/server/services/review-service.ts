import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { normalizeCriterionScore, aggregateScores, rubricWeightsSumTo100 } from "@/server/domain/scoring";
import { Decimal } from "@prisma/client/runtime/library";

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
  items: { criterionId: string; rawScore: string; comment?: string }[];
}) {
  const assignment = await prisma.reviewAssignment.findUniqueOrThrow({
    where: { id: params.assignmentId },
    include: { rubric: { include: { criteria: true } } },
  });
  if (assignment.reviewerId !== params.reviewerId) throw new Error("Không có quyền với bài được phân công.");
  if (assignment.status === "SUBMITTED" || assignment.status === "LOCKED") {
    throw new Error("Đánh giá đã nộp và bị khóa.");
  }
  const weights = assignment.rubric.criteria.map((c) => c.weight.toString());
  if (!rubricWeightsSumTo100(weights)) throw new Error("Rubric không hợp lệ: tổng trọng số phải bằng 100%.");
  const normalizedItems = params.items.map((item) => {
    const criterion = assignment.rubric.criteria.find((c) => c.id === item.criterionId);
    if (!criterion) throw new Error("Tiêu chí không thuộc rubric.");
    const normalized = normalizeCriterionScore({
      rawScore: item.rawScore,
      minScore: criterion.minScore.toString(),
      maxScore: criterion.maxScore.toString(),
      weight: criterion.weight.toString(),
    });
    return { ...item, normalizedScore: normalized.toString() };
  });
  const total = normalizedItems.reduce((acc, item) => acc.plus(item.normalizedScore), new Decimal(0));
  await prisma.$transaction(async (tx) => {
    const review = await tx.review.upsert({
      where: { assignmentId: assignment.id },
      update: {
        overallComment: params.overallComment,
        recommendation: params.recommendation,
        totalNormalized: total,
      },
      create: {
        assignmentId: assignment.id,
        overallComment: params.overallComment,
        recommendation: params.recommendation,
        totalNormalized: total,
      },
    });
    await tx.reviewScoreItem.deleteMany({ where: { reviewId: review.id } });
    await tx.reviewScoreItem.createMany({
      data: normalizedItems.map((item) => ({
        reviewId: review.id,
        criterionId: item.criterionId,
        rawScore: item.rawScore,
        normalizedScore: item.normalizedScore,
        comment: item.comment ?? "",
      })),
    });
    await tx.reviewAssignment.update({
      where: { id: assignment.id },
      data: { status: "DRAFT" },
    });
  });
}

export async function submitReview(params: { reviewerId: string; assignmentId: string }) {
  const assignment = await prisma.reviewAssignment.findUniqueOrThrow({
    where: { id: params.assignmentId },
    include: { review: { include: { items: true } }, rubric: { include: { criteria: true } } },
  });
  if (assignment.reviewerId !== params.reviewerId) throw new Error("Không có quyền.");
  if (!assignment.review || assignment.review.items.length !== assignment.rubric.criteria.length) {
    throw new Error("Cần chấm đủ các tiêu chí trước khi nộp.");
  }
  await prisma.reviewAssignment.update({
    where: { id: assignment.id, version: assignment.version },
    data: { status: "SUBMITTED", submittedAt: new Date(), version: { increment: 1 } },
  });
  await prisma.review.update({
    where: { id: assignment.review.id },
    data: { submittedAt: new Date() },
  });
  await writeAuditLog({
    actorUserId: params.reviewerId,
    action: "review.submit",
    entityType: "ReviewAssignment",
    entityId: assignment.id,
  });
}

export async function rankSubmissions(competitionId: string) {
  const submissions = await prisma.submission.findMany({
    where: { competitionId, status: { in: ["UNDER_REVIEW", "SCORED", "SUBMITTED", "LOCKED"] } },
    include: {
      registration: true,
      reviews: { include: { review: true } },
    },
  });
  return submissions
    .map((submission) => {
      const submitted = submission.reviews.filter((item) => item.status === "SUBMITTED" && item.review);
      const aggregate =
        submitted.length > 0
          ? aggregateScores(submitted.map((item) => item.review!.totalNormalized.toString()))
          : null;
      return {
        submissionId: submission.id,
        registrationId: submission.registrationId,
        code: submission.registration.code,
        completedReviews: submitted.length,
        assignedReviews: submission.reviews.length,
        aggregate: aggregate?.toString() ?? null,
        incomplete: submitted.length === 0,
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
    include: { review: true, submission: { include: { registration: true } } },
  });
  if (!assignment) throw new Error("Không tìm thấy phân công.");
  if (assignment.status === "SUBMITTED" || assignment.status === "LOCKED") {
    throw new Error("Reviewer đã nộp phiếu. Không gỡ được — cần SUPER_ADMIN mở lại nếu có sự cố.");
  }
  await prisma.$transaction(async (tx) => {
    if (assignment.review) {
      await tx.reviewScoreItem.deleteMany({ where: { reviewId: assignment.review.id } });
      await tx.review.delete({ where: { id: assignment.review.id } });
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
