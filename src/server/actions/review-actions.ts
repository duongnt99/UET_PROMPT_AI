"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import {
  saveReviewDraft,
  startReviewResubmit,
  submitReview,
} from "@/server/services/review-service";
import { ReviewValidationError } from "@/server/domain/review-scoring";

export type ReviewActionState =
  | { ok: true; message?: string; savedAt?: string; fieldErrors?: never }
  | { ok: false; message: string; fieldErrors?: Array<{ criterionId: string; field: "rawScore"; message: string }> };

function parseReviewItems(formData: FormData) {
  return JSON.parse(String(formData.get("items") ?? "[]")) as {
    criterionId: string;
    rawScore: string;
    comment?: string;
  }[];
}

function parseDraftPayload(formData: FormData) {
  return {
    overallComment: String(formData.get("overallComment") ?? ""),
    recommendation: (formData.get("recommendation") as "STRONG_YES" | "YES" | "MAYBE" | "NO" | null) || undefined,
    items: parseReviewItems(formData),
  };
}

function toActionError(error: unknown): ReviewActionState {
  if (error instanceof ReviewValidationError) {
    return {
      ok: false,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Không thể xử lý đánh giá.",
  };
}

export async function saveReviewAction(formData: FormData): Promise<ReviewActionState> {
  const user = await requireUser();
  const assignmentId = String(formData.get("assignmentId"));
  try {
    const result = await saveReviewDraft({
      reviewerId: user.id,
      assignmentId,
      ...parseDraftPayload(formData),
    });
    revalidatePath("/reviewer");
    revalidatePath(`/reviewer/${assignmentId}`);
    return {
      ok: true,
      message: "Đã lưu nháp.",
      savedAt: result.savedAt,
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function submitReviewAction(formData: FormData): Promise<ReviewActionState> {
  const user = await requireUser();
  const assignmentId = String(formData.get("assignmentId"));
  try {
    await submitReview({
      reviewerId: user.id,
      assignmentId,
      draft: parseDraftPayload(formData),
    });
    revalidatePath("/reviewer");
    revalidatePath(`/reviewer/${assignmentId}`);
    revalidatePath("/admin/finalists");
    return { ok: true, message: "Đã nộp đánh giá." };
  } catch (error) {
    return toActionError(error);
  }
}

export async function startReviewResubmitAction(formData: FormData): Promise<ReviewActionState> {
  const user = await requireUser();
  const assignmentId = String(formData.get("assignmentId"));
  try {
    await startReviewResubmit({ reviewerId: user.id, assignmentId });
    revalidatePath("/reviewer");
    revalidatePath(`/reviewer/${assignmentId}`);
    return { ok: true, message: "Đã mở bản chấm lại." };
  } catch (error) {
    return toActionError(error);
  }
}
