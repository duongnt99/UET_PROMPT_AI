import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createEmailBatch } from "@/server/email/email-batch-service";
import { processEmailQueue } from "@/server/email/email-worker";
import { EmailSendError } from "@/server/email/email-service";

const hasDb = Boolean(process.env.DATABASE_URL);
const createdBatchIds: string[] = [];
const createdNotificationIds: string[] = [];

describe.skipIf(!hasDb)("email batch", () => {
  afterAll(async () => {
    if (createdNotificationIds.length) await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } });
    if (createdBatchIds.length) await prisma.emailBatch.deleteMany({ where: { id: { in: createdBatchIds } } });
  });

  it("is idempotent and one failed recipient does not fail other deliveries", async () => {
    const actor = await prisma.user.findFirst({
      where: { roleAssignments: { some: { role: "SUPER_ADMIN", revokedAt: null } } },
    });
    const recipients = await prisma.user.findMany({ where: { status: "ACTIVE", deletedAt: null }, take: 2 });
    if (!actor || recipients.length < 2) return;
    const result = await createEmailBatch({
      actorUserId: actor.id,
      recipientType: "SPECIFIC_USERS",
      subject: "Kiểm thử email batch",
      content: "Nội dung kiểm thử.",
      userIds: [recipients[0].id, recipients[0].id, recipients[1].id],
      idempotencyKey: crypto.randomUUID(),
    });
    createdBatchIds.push(result.batch.id);
    createdNotificationIds.push(...recipients.map((recipient) => `email-batch:${result.batch.id}:${recipient.id}`));
    expect(result.batch.recipientCount).toBe(2);
    const notifications = await prisma.notification.findMany({
      where: { id: { in: createdNotificationIds } },
      orderBy: { userId: "asc" },
    });
    expect(notifications).toHaveLength(2);
    expect(notifications.every((item) => item.title === "Kiểm thử email batch")).toBe(true);

    const duplicate = await createEmailBatch({
      actorUserId: actor.id,
      recipientType: "SPECIFIC_USERS",
      subject: "Kiểm thử email batch",
      content: "Nội dung kiểm thử.",
      userIds: [recipients[0].id],
      idempotencyKey: result.batch.idempotencyKey,
    });
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.batch.id).toBe(result.batch.id);

    await processEmailQueue(async (input) => {
      if (input.to === recipients[1].emailNormalized) throw new EmailSendError("Địa chỉ bị từ chối.");
      return { messageId: `test:${input.deliveryId}` };
    });
    const completed = await prisma.emailBatch.findUniqueOrThrow({ where: { id: result.batch.id } });
    expect(completed.status).toBe("PARTIALLY_FAILED");
    expect(completed.successCount).toBe(1);
    expect(completed.failedCount).toBe(1);
  });
});
