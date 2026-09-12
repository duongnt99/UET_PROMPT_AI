"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveReviewAction,
  startReviewResubmitAction,
  submitReviewAction,
  type ReviewActionState,
} from "@/server/actions/review-actions";
import { formatScoreDisplay } from "@/server/domain/scoring";
import { reviewAttemptUsageLabel } from "@/server/domain/review-scoring";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";

type Criterion = {
  id: string;
  titleVi: string;
  weight: string;
  minScore: string;
  maxScore: string;
  scoreStep: string;
};

type ReviewValues = {
  scores: Record<string, string>;
  comments: Record<string, string>;
  overallComment: string;
};

type FieldErrors = Record<string, string>;

function buildInitialValues(
  criteria: Criterion[],
  source?: {
    items: Array<{ criterionId: string; rawScore: string; comment: string }>;
    overallComment: string;
  } | null,
): ReviewValues {
  const scores: Record<string, string> = {};
  const comments: Record<string, string> = {};
  for (const criterion of criteria) {
    const item = source?.items.find((entry) => entry.criterionId === criterion.id);
    scores[criterion.id] = item?.rawScore ?? "";
    comments[criterion.id] = item?.comment ?? "";
  }
  return {
    scores,
    comments,
    overallComment: source?.overallComment ?? "",
  };
}

function ReadOnlyReview({
  criteria,
  values,
  totalNormalized,
  submittedAt,
}: {
  criteria: Criterion[];
  values: ReviewValues;
  totalNormalized?: string | null;
  submittedAt?: string | null;
}) {
  return (
    <div className="space-y-4">
      {criteria.map((criterion) => (
        <div key={criterion.id} className="rounded-xl border p-3">
          <p className="font-medium">
            {criterion.titleVi} ({criterion.weight}%)
          </p>
          <p className="mt-2 text-sm text-slate-800">Điểm: {values.scores[criterion.id] || "—"}</p>
          {values.comments[criterion.id] ? (
            <p className="mt-2 text-sm text-slate-600">{values.comments[criterion.id]}</p>
          ) : null}
        </div>
      ))}
      {values.overallComment ? (
        <div className="rounded-xl border p-3">
          <p className="font-medium">Nhận xét tổng</p>
          <p className="mt-2 text-sm text-slate-700">{values.overallComment}</p>
        </div>
      ) : null}
      {totalNormalized ? (
        <p className="text-sm text-slate-700">Tổng điểm chuẩn hóa: {formatScoreDisplay(totalNormalized)}</p>
      ) : null}
      {submittedAt ? (
        <p className="text-sm text-slate-500">Đã nộp lúc {new Date(submittedAt).toLocaleString("vi-VN")}</p>
      ) : null}
    </div>
  );
}

export function ReviewForm({
  assignmentId,
  criteria,
  mode,
  initialReview,
  latestSubmittedReview,
  submittedAttemptCount,
  submissionLimit,
  canResubmit,
}: {
  assignmentId: string;
  criteria: Criterion[];
  mode: "edit" | "readonly";
  initialReview: {
    items: Array<{ criterionId: string; rawScore: string; comment: string }>;
    overallComment: string;
    totalNormalized?: string | null;
    submittedAt?: string | null;
  } | null;
  latestSubmittedReview: {
    items: Array<{ criterionId: string; rawScore: string; comment: string }>;
    overallComment: string;
    totalNormalized?: string | null;
    submittedAt?: string | null;
  } | null;
  submittedAttemptCount: number;
  submissionLimit: number;
  canResubmit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resubmitPending, startResubmitTransition] = useTransition();
  const [values, setValues] = useState<ReviewValues>(() => buildInitialValues(criteria, initialReview));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const readonlySource = useMemo(
    () => latestSubmittedReview ?? initialReview,
    [initialReview, latestSubmittedReview],
  );
  const readonlyValues = useMemo(
    () => buildInitialValues(criteria, readonlySource),
    [criteria, readonlySource],
  );

  function applyActionResult(result: ReviewActionState, onSuccess?: () => void) {
    if (!result.ok) {
      setFormError(result.message);
      if (result.fieldErrors?.length) {
        const nextErrors: FieldErrors = {};
        for (const error of result.fieldErrors) {
          nextErrors[error.criterionId] = error.message;
        }
        setFieldErrors(nextErrors);
      }
      toast.error(result.message);
      return;
    }
    setFormError(null);
    setFieldErrors({});
    if (result.message) toast.success(result.message);
    if (result.savedAt) setSavedAt(result.savedAt);
    onSuccess?.();
  }

  function buildItemsPayload() {
    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      rawScore: values.scores[criterion.id] ?? "",
      comment: values.comments[criterion.id] ?? "",
    }));
  }

  function buildFormData() {
    const formData = new FormData();
    formData.set("assignmentId", assignmentId);
    formData.set("overallComment", values.overallComment);
    formData.set("items", JSON.stringify(buildItemsPayload()));
    return formData;
  }

  function updateScore(criterionId: string, rawScore: string) {
    setValues((current) => ({
      ...current,
      scores: { ...current.scores, [criterionId]: rawScore },
    }));
    setFieldErrors((current) => {
      if (!current[criterionId]) return current;
      const next = { ...current };
      delete next[criterionId];
      return next;
    });
  }

  function handleSaveDraft() {
    if (mode !== "edit" || pending) return;
    startTransition(async () => {
      const result = await saveReviewAction(buildFormData());
      applyActionResult(result);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleSubmit() {
    if (mode !== "edit" || pending) return;
    startTransition(async () => {
      const result = await submitReviewAction(buildFormData());
      applyActionResult(result, () => {
        router.push("/reviewer");
        router.refresh();
      });
    });
  }

  function handleResubmit() {
    if (!canResubmit || resubmitPending) return;
    startResubmitTransition(async () => {
      const formData = new FormData();
      formData.set("assignmentId", assignmentId);
      const result = await startReviewResubmitAction(formData);
      applyActionResult(result, () => {
        router.refresh();
      });
    });
  }

  if (mode === "readonly") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Đã nộp {reviewAttemptUsageLabel(submittedAttemptCount, submissionLimit)}.
        </p>
        <ReadOnlyReview
          criteria={criteria}
          values={readonlyValues}
          totalNormalized={readonlySource?.totalNormalized}
          submittedAt={readonlySource?.submittedAt}
        />
        {canResubmit ? (
          <Button type="button" onClick={handleResubmit} disabled={resubmitPending}>
            {resubmitPending ? "Đang mở..." : "Chấm lại"}
          </Button>
        ) : (
          <p className="text-sm text-slate-500">Đã sử dụng hết số lượt nộp đánh giá.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Lượt nộp: {reviewAttemptUsageLabel(submittedAttemptCount, submissionLimit)}
      </p>
      {criteria.map((criterion) => (
        <div key={criterion.id} className="rounded-xl border p-3">
          <Label htmlFor={`score-${criterion.id}`}>
            {criterion.titleVi} ({criterion.weight}%)
          </Label>
          <Input
            id={`score-${criterion.id}`}
            name={`score-${criterion.id}`}
            type="number"
            step={criterion.scoreStep}
            min={criterion.minScore}
            max={criterion.maxScore}
            value={values.scores[criterion.id] ?? ""}
            onChange={(event) => updateScore(criterion.id, event.target.value)}
            className="mt-1"
          />
          {fieldErrors[criterion.id] ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors[criterion.id]}</p>
          ) : null}
          <Textarea
            name={`comment-${criterion.id}`}
            placeholder="Nhận xét tiêu chí"
            value={values.comments[criterion.id] ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                comments: { ...current.comments, [criterion.id]: event.target.value },
              }))
            }
            className="mt-2"
          />
        </div>
      ))}
      <Textarea
        name="overallComment"
        placeholder="Nhận xét tổng"
        value={values.overallComment}
        onChange={(event) => setValues((current) => ({ ...current, overallComment: event.target.value }))}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={pending}>
          {pending ? "Đang lưu..." : "Lưu nháp"}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending}>
          {pending ? "Đang nộp..." : "Nộp đánh giá"}
        </Button>
      </div>
      {savedAt ? (
        <p className="text-sm text-emerald-700">
          Đã lưu nháp lúc {new Date(savedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      ) : null}
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
    </div>
  );
}
