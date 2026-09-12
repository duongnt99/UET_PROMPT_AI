import { normalizeCriterionScore } from "@/server/domain/scoring";
import Decimal from "decimal.js";

export type ReviewCriterionRule = {
  id: string;
  titleVi: string;
  minScore: string;
  maxScore: string;
  scoreStep: string;
};

export type ReviewScoreFieldError = {
  criterionId: string;
  field: "rawScore";
  message: string;
};

export type ReviewAttemptLike = {
  attemptNumber: number;
  status: "DRAFT" | "SUBMITTED";
};

export class ReviewValidationError extends Error {
  fieldErrors: ReviewScoreFieldError[];

  constructor(message: string, fieldErrors: ReviewScoreFieldError[]) {
    super(message);
    this.name = "ReviewValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function reviewScoreRangeMessage(minScore: string, maxScore: string): string {
  const min = formatScoreBound(minScore);
  const max = formatScoreBound(maxScore);
  return `Điểm phải nằm trong khoảng từ ${min} đến ${max}.`;
}

function formatScoreBound(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return Number.isInteger(numeric) ? String(numeric) : String(numeric);
}

export function validateCriterionRawScore(
  rawScore: string,
  criterion: ReviewCriterionRule,
): string | null {
  const trimmed = rawScore.trim();
  if (!trimmed) {
    return "Cần nhập điểm cho tiêu chí này.";
  }
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return reviewScoreRangeMessage(criterion.minScore, criterion.maxScore);
  }
  const min = Number(criterion.minScore);
  const max = Number(criterion.maxScore);
  if (numeric < min || numeric > max) {
    return reviewScoreRangeMessage(criterion.minScore, criterion.maxScore);
  }
  const step = Number(criterion.scoreStep);
  if (Number.isFinite(step) && step > 0) {
    const offset = numeric - min;
    const steps = offset / step;
    const roundedSteps = Math.round(steps);
    if (Math.abs(steps - roundedSteps) > 1e-9) {
      return `Điểm phải là bội số của ${formatScoreBound(criterion.scoreStep)} trong khoảng cho phép.`;
    }
  }
  return null;
}

export function validateReviewDraftItems(
  items: { criterionId: string; rawScore: string }[],
  criteria: ReviewCriterionRule[],
): ReviewScoreFieldError[] {
  const errors: ReviewScoreFieldError[] = [];
  for (const criterion of criteria) {
    const item = items.find((entry) => entry.criterionId === criterion.id);
    const message = validateCriterionRawScore(item?.rawScore ?? "", criterion);
    if (message) {
      errors.push({ criterionId: criterion.id, field: "rawScore", message });
    }
  }
  return errors;
}

export function assertValidReviewDraftItems(
  items: { criterionId: string; rawScore: string }[],
  criteria: ReviewCriterionRule[],
) {
  const fieldErrors = validateReviewDraftItems(items, criteria);
  if (fieldErrors.length > 0) {
    throw new ReviewValidationError("Vui lòng kiểm tra lại các điểm chưa hợp lệ.", fieldErrors);
  }
}

export function computeReviewTotalNormalized(
  items: { criterionId: string; rawScore: string }[],
  criteria: Array<ReviewCriterionRule & { weight: string }>,
): Decimal {
  const normalizedItems = items.map((item) => {
    const criterion = criteria.find((entry) => entry.id === item.criterionId);
    if (!criterion) {
      throw new ReviewValidationError("Tiêu chí không thuộc rubric.", []);
    }
    return normalizeCriterionScore({
      rawScore: item.rawScore.trim(),
      minScore: criterion.minScore,
      maxScore: criterion.maxScore,
      weight: criterion.weight,
    });
  });
  return normalizedItems.reduce((acc, score) => acc.plus(score), new Decimal(0));
}

export function getLatestSubmittedReview<T extends ReviewAttemptLike>(reviews: T[]): T | null {
  return (
    reviews
      .filter((review) => review.status === "SUBMITTED")
      .sort((a, b) => b.attemptNumber - a.attemptNumber)[0] ?? null
  );
}

export function getActiveDraftReview<T extends ReviewAttemptLike>(reviews: T[]): T | null {
  return reviews.find((review) => review.status === "DRAFT") ?? null;
}

export function canStartResubmit(submittedAttemptCount: number, submissionLimit: number): boolean {
  return submittedAttemptCount < submissionLimit;
}

export function hasSubmissionAttemptsRemaining(
  submittedAttemptCount: number,
  submissionLimit: number,
): boolean {
  return submittedAttemptCount < submissionLimit;
}

export function reviewAttemptUsageLabel(submittedAttemptCount: number, submissionLimit: number): string {
  return `${submittedAttemptCount}/${submissionLimit} lượt`;
}

export function resolveReviewSubmissionLimit(
  submissionLimit: number | null | undefined,
  competitionDefault: number,
): number {
  if (submissionLimit != null && submissionLimit >= 1) {
    return submissionLimit;
  }
  return competitionDefault >= 1 ? competitionDefault : 1;
}
