"use server";

import { requireUser } from "@/lib/auth/guards";
import { saveReviewDraft, submitReview } from "@/server/services/review-service";

export async function saveReviewAction(formData: FormData) {
  const user = await requireUser();
  const assignmentId = String(formData.get("assignmentId"));
  const items = JSON.parse(String(formData.get("items") ?? "[]")) as {
    criterionId: string;
    rawScore: string;
    comment?: string;
  }[];
  await saveReviewDraft({
    reviewerId: user.id,
    assignmentId,
    overallComment: String(formData.get("overallComment") ?? ""),
    recommendation: (formData.get("recommendation") as "YES") || undefined,
    items,
  });
  return { ok: true };
}

export async function submitReviewAction(formData: FormData) {
  const user = await requireUser();
  await submitReview({ reviewerId: user.id, assignmentId: String(formData.get("assignmentId")) });
  return { ok: true };
}
