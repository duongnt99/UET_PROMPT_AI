"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type { EmailRecipientType } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { consumeRateLimit } from "@/lib/rate-limit";
import { adminEmailSchema } from "@/server/domain/email";
import { createEmailBatch, retryEmailBatch } from "@/server/email/email-batch-service";
import { processEmailQueue } from "@/server/email/email-worker";

export type EmailActionState = { ok: boolean; message: string; batchId?: string };

export async function sendAdminEmailAction(formData: FormData): Promise<EmailActionState> {
  const actor = await requirePermission("email:manage");
  const parsed = adminEmailSchema.safeParse({
    recipientType: String(formData.get("recipientType") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    content: String(formData.get("content") ?? ""),
    userIds: formData.getAll("userIds").map(String),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu gửi email không hợp lệ." };
  }
  const rateLimit = await consumeRateLimit(`admin-email:${actor.id}`, 20, 60 * 60_000);
  if (!rateLimit.ok) return { ok: false, message: "Bạn đã tạo quá nhiều đợt gửi. Vui lòng thử lại sau." };

  try {
    const result = await createEmailBatch({
      actorUserId: actor.id,
      recipientType: parsed.data.recipientType as EmailRecipientType,
      subject: parsed.data.subject,
      content: parsed.data.content,
      userIds: parsed.data.userIds,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    after(() => processEmailQueue());
    revalidatePath("/admin/email");
    return {
      ok: true,
      batchId: result.batch.id,
      message: result.duplicate
        ? "Yêu cầu này đã được ghi nhận trước đó; hệ thống không tạo đợt gửi trùng."
        : `Đã tạo đợt gửi cho ${result.batch.recipientCount} người nhận.`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không tạo được đợt gửi email." };
  }
}

export async function retryAdminEmailBatchAction(formData: FormData): Promise<EmailActionState> {
  const actor = await requirePermission("email:manage");
  const batchId = String(formData.get("batchId") ?? "").trim();
  if (!batchId) return { ok: false, message: "Thiếu mã đợt gửi." };
  try {
    const count = await retryEmailBatch(batchId, actor.id);
    after(() => processEmailQueue());
    revalidatePath("/admin/email");
    revalidatePath(`/admin/email/${batchId}`);
    return { ok: true, batchId, message: `Đã đưa ${count} email lỗi vào hàng đợi gửi lại.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không thể gửi lại email." };
  }
}
