import { describe, expect, it } from "vitest";
import {
  canStartResubmit,
  computeReviewTotalNormalized,
  getLatestSubmittedReview,
  hasSubmissionAttemptsRemaining,
  resolveReviewSubmissionLimit,
  reviewAttemptUsageLabel,
  validateCriterionRawScore,
  validateReviewDraftItems,
} from "@/server/domain/review-scoring";

const criteria = [
  {
    id: "c1",
    titleVi: "Tiêu chí 1",
    minScore: "0",
    maxScore: "10",
    scoreStep: "0.5",
    weight: "40",
  },
  {
    id: "c2",
    titleVi: "Tiêu chí 2",
    minScore: "0",
    maxScore: "10",
    scoreStep: "0.5",
    weight: "30",
  },
  {
    id: "c3",
    titleVi: "Tiêu chí 3",
    minScore: "0",
    maxScore: "10",
    scoreStep: "0.5",
    weight: "30",
  },
];

describe("review score validation", () => {
  it("rejects negative scores", () => {
    expect(validateCriterionRawScore("-1", criteria[0])).toContain("0");
    expect(validateCriterionRawScore("-1", criteria[0])).toContain("10");
  });

  it("rejects scores above max", () => {
    expect(validateCriterionRawScore("11", criteria[0])).toContain("10");
  });

  it("rejects malformed values", () => {
    expect(validateCriterionRawScore("abc", criteria[0])).not.toBeNull();
    expect(validateCriterionRawScore("NaN", criteria[0])).not.toBeNull();
    expect(validateCriterionRawScore("Infinity", criteria[0])).not.toBeNull();
  });

  it("accepts boundary scores", () => {
    expect(validateCriterionRawScore("0", criteria[0])).toBeNull();
    expect(validateCriterionRawScore("10", criteria[0])).toBeNull();
    expect(validateCriterionRawScore("8.5", criteria[0])).toBeNull();
  });

  it("returns field errors for invalid draft items", () => {
    const errors = validateReviewDraftItems(
      [
        { criterionId: "c1", rawScore: "8" },
        { criterionId: "c2", rawScore: "15" },
        { criterionId: "c3", rawScore: "" },
      ],
      criteria,
    );
    expect(errors).toHaveLength(2);
    expect(errors.map((item) => item.criterionId)).toEqual(["c2", "c3"]);
  });
});

describe("review attempt semantics", () => {
  it("tracks submission limit usage", () => {
    expect(hasSubmissionAttemptsRemaining(0, 1)).toBe(true);
    expect(hasSubmissionAttemptsRemaining(1, 1)).toBe(false);
    expect(canStartResubmit(1, 3)).toBe(true);
    expect(canStartResubmit(3, 3)).toBe(false);
    expect(reviewAttemptUsageLabel(2, 3)).toBe("2/3 lượt");
  });

  it("selects latest submitted attempt as canonical", () => {
    const latest = getLatestSubmittedReview([
      { attemptNumber: 1, status: "SUBMITTED" },
      { attemptNumber: 2, status: "DRAFT" },
      { attemptNumber: 3, status: "SUBMITTED" },
    ]);
    expect(latest?.attemptNumber).toBe(3);
  });

  it("computes total normalized score from valid draft items", () => {
    const total = computeReviewTotalNormalized(
      [
        { criterionId: "c1", rawScore: "8" },
        { criterionId: "c2", rawScore: "9" },
        { criterionId: "c3", rawScore: "7.5" },
      ],
      criteria,
    );
    expect(total.toString()).toBe("81.5");
  });
});

describe("per-submission limit resolution", () => {
  it("uses submission override when set", () => {
    expect(resolveReviewSubmissionLimit(3, 1)).toBe(3);
  });

  it("falls back to competition default when submission limit is null", () => {
    expect(resolveReviewSubmissionLimit(null, 2)).toBe(2);
    expect(resolveReviewSubmissionLimit(undefined, 2)).toBe(2);
  });
});

describe("admin limit changes", () => {
  it("allows more submissions when admin increases limit", () => {
    expect(hasSubmissionAttemptsRemaining(1, 1)).toBe(false);
    expect(hasSubmissionAttemptsRemaining(1, 3)).toBe(true);
  });

  it("blocks new submissions when used attempts exceed lowered limit without deleting history", () => {
    expect(hasSubmissionAttemptsRemaining(2, 1)).toBe(false);
    expect(canStartResubmit(2, 1)).toBe(false);
  });
});
