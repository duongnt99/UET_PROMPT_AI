"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export type SubmissionAdminActionState = { ok: boolean; message: string };

const limitSchema = z.number().int().min(1).max(20).nullable();

export async function updateSubmissionReviewLimitAction(
  _prev: SubmissionAdminActionState,
  formData: FormData,
): Promise<SubmissionAdminActionState> {
  try {
    const user = await requirePermission("submission:manage");
    const submissionId = String(formData.get("submissionId") ?? "");
    const useDefault = formData.get("useDefault") === "on";
    const raw = String(formData.get("reviewSubmissionLimit") ?? "").trim();
    const reviewSubmissionLimit = useDefault || raw === "" ? null : limitSchema.parse(Number(raw));

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { registration: true },
    });
    if (!submission || submission.deletedAt) {
      return { ok: false, message: "Không tìm thấy bài nộp." };
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { reviewSubmissionLimit },
    });

    await writeAuditLog({
      actorUserId: user.id,
      competitionId: submission.competitionId,
      action: "submission.review_limit_update",
      entityType: "Submission",
      entityId: submissionId,
      after: { reviewSubmissionLimit, registrationCode: submission.registration.code },
      reason: String(formData.get("reason") ?? "Admin updated per-submission review limit"),
    });

    revalidatePath(`/admin/submissions/${submissionId}`);
    revalidatePath("/admin/review-assignments");
    return {
      ok: true,
      message: reviewSubmissionLimit
        ? `Đã đặt ${reviewSubmissionLimit} lượt nộp/reviewer cho bài này.`
        : "Đã dùng mặc định toàn cuộc thi cho bài này.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không lưu được cài đặt.",
    };
  }
}
