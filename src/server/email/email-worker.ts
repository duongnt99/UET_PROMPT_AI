import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/config/env";
import { logger } from "@/lib/logging";
import { finalBatchStatus } from "@/server/domain/email";
import { EmailSendError, sendEmail } from "@/server/email/email-service";

let workerRunning = false;

async function runWithConcurrency<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const item = items[index++];
        await task(item);
      }
    }),
  );
}

async function refreshBatch(batchId: string) {
  const counts = await prisma.emailOutbox.groupBy({
    by: ["status"],
    where: { batchId },
    _count: { _all: true },
  });
  const count = (status: string) => counts.find((item) => item.status === status)?._count._all ?? 0;
  const successCount = count("SENT");
  const failedCount = count("FAILED");
  const outstanding = count("PENDING") + count("SENDING");
  await prisma.emailBatch.update({
    where: { id: batchId },
    data: {
      successCount,
      failedCount,
      status: outstanding > 0 ? "SENDING" : finalBatchStatus(successCount, failedCount),
      completedAt: outstanding > 0 ? null : new Date(),
    },
  });
}

export async function processEmailQueue(sender: typeof sendEmail = sendEmail) {
  if (workerRunning) return;
  workerRunning = true;
  try {
    const env = getEnv();
    const now = new Date();
    await prisma.emailOutbox.updateMany({
      where: { status: "SENDING", updatedAt: { lt: new Date(now.getTime() - 5 * 60_000) }, batchId: { not: null } },
      data: { status: "PENDING", scheduledAt: now },
    });
    const deliveries = await prisma.emailOutbox.findMany({
      where: { status: "PENDING", scheduledAt: { lte: now }, batchId: { not: null } },
      orderBy: { createdAt: "asc" },
      take: env.EMAIL_BATCH_SIZE,
      include: { batch: true },
    });
    const touched = new Set<string>();
    await runWithConcurrency(deliveries, env.EMAIL_SEND_CONCURRENCY, async (delivery) => {
      if (!delivery.batch) return;
      const claimed = await prisma.emailOutbox.updateMany({
        where: { id: delivery.id, status: "PENDING" },
        data: { status: "SENDING", attempts: { increment: 1 } },
      });
      if (claimed.count === 0) return;
      touched.add(delivery.batch.id);
      await prisma.emailBatch.updateMany({
        where: { id: delivery.batch.id, status: { in: ["PENDING", "SENDING"] } },
        data: { status: "SENDING", startedAt: delivery.batch.startedAt ?? new Date() },
      });
      try {
        const result = await sender({
          to: delivery.toEmail,
          subject: delivery.batch.subject,
          text: delivery.batch.textContent,
          html: delivery.batch.htmlContent,
          deliveryId: delivery.id,
        });
        await prisma.emailOutbox.update({
          where: { id: delivery.id },
          data: { status: "SENT", sentAt: new Date(), lastError: null, providerMessageId: result.messageId },
        });
      } catch (error) {
        const transient = error instanceof EmailSendError && error.transient;
        const attempts = delivery.attempts + 1;
        const retry = transient && attempts < env.EMAIL_MAX_ATTEMPTS;
        await prisma.emailOutbox.update({
          where: { id: delivery.id },
          data: {
            status: retry ? "PENDING" : "FAILED",
            scheduledAt: retry ? new Date(Date.now() + attempts * 30_000) : delivery.scheduledAt,
            lastError: (error instanceof Error ? error.message : "Gửi email thất bại.").slice(0, 1000),
          },
        });
        logger.warn("Email delivery failed", { deliveryId: delivery.id, transient, attempts });
      }
    });
    await Promise.all([...touched].map(refreshBatch));
  } catch (error) {
    logger.error("Email worker failed", { error: String(error) });
  } finally {
    workerRunning = false;
  }
}

export function startEmailWorker() {
  const interval = getEnv().EMAIL_WORKER_INTERVAL_MS;
  void processEmailQueue();
  const timer = setInterval(() => void processEmailQueue(), interval);
  timer.unref();
  return () => clearInterval(timer);
}
