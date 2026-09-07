import { Prisma, type EmailRecipientType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import { adminEmailSchema, dedupeRecipients, renderAdminEmail } from "@/server/domain/email";

type CreateBatchInput = {
  actorUserId: string;
  recipientType: EmailRecipientType;
  subject: string;
  content: string;
  userIds: string[];
  idempotencyKey: string;
};

async function resolveRecipients(recipientType: EmailRecipientType, userIds: string[]) {
  const active = { status: "ACTIVE" as const, deletedAt: null };
  const where =
    recipientType === "ALL_USERS"
      ? active
      : recipientType === "ALL_PARTICIPANTS"
        ? { ...active, roleAssignments: { some: { role: "PARTICIPANT" as const, revokedAt: null } } }
        : { ...active, id: { in: [...new Set(userIds)] } };
  const candidates = await prisma.user.findMany({
    where,
    select: { id: true, email: true, emailNormalized: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  const recipients = dedupeRecipients(candidates).map((user) => ({
    ...user,
    email: normalizeEmail(user.email),
  }));
  const requestedCount = recipientType === "SPECIFIC_USERS" ? new Set(userIds).size : candidates.length;
  return { recipients, skippedCount: Math.max(0, requestedCount - recipients.length) };
}

export async function countEmailRecipients(recipientType: EmailRecipientType, userIds: string[] = []) {
  return (await resolveRecipients(recipientType, userIds)).recipients.length;
}

export async function createEmailBatch(input: CreateBatchInput) {
  const parsed = adminEmailSchema.parse(input);
  const existing = await prisma.emailBatch.findUnique({ where: { idempotencyKey: parsed.idempotencyKey } });
  if (existing) return { batch: existing, duplicate: true as const };

  const { recipients, skippedCount } = await resolveRecipients(parsed.recipientType, parsed.userIds);
  if (recipients.length === 0) throw new Error("Không tìm thấy người nhận hợp lệ.");
  const rendered = renderAdminEmail(parsed.content);

  try {
    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.emailBatch.create({
        data: {
          createdByAdminId: input.actorUserId,
          subject: parsed.subject,
          textContent: rendered.text,
          htmlContent: rendered.html,
          recipientType: parsed.recipientType,
          recipientFilter:
            parsed.recipientType === "SPECIFIC_USERS" ? { userIds: parsed.userIds } : Prisma.JsonNull,
          recipientCount: recipients.length,
          skippedCount,
          idempotencyKey: parsed.idempotencyKey,
        },
      });
      await tx.emailOutbox.createMany({
        data: recipients.map((recipient) => ({
          batchId: created.id,
          userId: recipient.id,
          toEmail: recipient.email,
          templateCode: "ADMIN_BROADCAST",
          payload: { batchId: created.id },
          idempotencyKey: `email-batch:${created.id}:${recipient.email}`,
        })),
      });
      await tx.notification.createMany({
        data: recipients.map((recipient) => ({
          id: `email-batch:${created.id}:${recipient.id}`,
          userId: recipient.id,
          title: parsed.subject,
          body: rendered.text,
        })),
        skipDuplicates: true,
      });
      return created;
    });
    await writeAuditLog({
      actorUserId: input.actorUserId,
      action: "email.batch.create",
      entityType: "EmailBatch",
      entityId: batch.id,
      after: {
        subject: batch.subject,
        recipientType: batch.recipientType,
        recipientCount: batch.recipientCount,
        skippedCount: batch.skippedCount,
      },
    });
    return { batch, duplicate: false as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const batch = await prisma.emailBatch.findUniqueOrThrow({ where: { idempotencyKey: parsed.idempotencyKey } });
      return { batch, duplicate: true as const };
    }
    throw error;
  }
}

export async function retryEmailBatch(batchId: string, actorUserId: string) {
  const result = await prisma.emailOutbox.updateMany({
    where: { batchId, status: "FAILED" },
    data: { status: "PENDING", attempts: 0, lastError: null, scheduledAt: new Date() },
  });
  if (result.count === 0) throw new Error("Batch không có email lỗi để gửi lại.");
  await prisma.emailBatch.update({
    where: { id: batchId },
    data: { status: "PENDING", failedCount: 0, completedAt: null },
  });
  await writeAuditLog({
    actorUserId,
    action: "email.batch.retry",
    entityType: "EmailBatch",
    entityId: batchId,
    after: { retryCount: result.count },
  });
  return result.count;
}
