import { prisma } from "@/lib/db/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function consumeRateLimit(key: string, max = MAX_ATTEMPTS, windowMs = WINDOW_MS) {
  const now = new Date();
  const existing = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!existing || now.getTime() - existing.windowStart.getTime() > windowMs) {
    await prisma.authRateLimit.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });
    return { ok: true, remaining: max - 1 };
  }
  if (existing.count >= max) {
    return { ok: false, remaining: 0 };
  }
  await prisma.authRateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true, remaining: max - existing.count - 1 };
}
