import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/logging";

type AuditInput = {
  actorUserId?: string | null;
  competitionId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        competitionId: input.competitionId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before ?? undefined,
        after: input.after ?? undefined,
        reason: input.reason ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    logger.error("Failed to write audit log", { error: String(error), action: input.action });
  }
}
