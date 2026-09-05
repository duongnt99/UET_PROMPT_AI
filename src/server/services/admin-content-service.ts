import type { ContentStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { toContentSlug } from "@/lib/utils";
import { requireProductionCompetition } from "@/server/services/competition-service";

const STATUSES: ContentStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export function parseContentStatus(value: string): ContentStatus {
  return STATUSES.includes(value as ContentStatus) ? (value as ContentStatus) : "DRAFT";
}

export function requireContentSlug(raw: string, fallbackTitle: string): string {
  const slug = toContentSlug(raw || fallbackTitle);
  if (!slug) throw new Error("Slug không hợp lệ. Dùng chữ không dấu, số và gạch ngang.");
  return slug;
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function saveStaticPage(params: {
  actorUserId: string;
  id?: string;
  slug: string;
  title: string;
  bodyMarkdown: string;
  status: ContentStatus;
}) {
  const competition = await requireProductionCompetition();
  const slug = requireContentSlug(params.slug, params.title);
  const title = params.title.trim();
  if (!title) throw new Error("Cần tiêu đề trang.");
  try {
    const page = params.id
      ? await prisma.staticPage.update({
          where: { id: params.id },
          data: { slug, title, bodyMarkdown: params.bodyMarkdown, status: params.status },
        })
      : await prisma.staticPage.create({
          data: {
            competitionId: competition.id,
            slug,
            title,
            bodyMarkdown: params.bodyMarkdown,
            status: params.status,
          },
        });
    await writeAuditLog({
      actorUserId: params.actorUserId,
      competitionId: competition.id,
      action: params.id ? "content.static_page.update" : "content.static_page.create",
      entityType: "StaticPage",
      entityId: page.id,
      after: { slug, status: params.status },
    });
    return page;
  } catch (error) {
    if (isUniqueConflict(error)) throw new Error(`Slug "${slug}" đã được dùng. Chọn slug khác.`);
    throw error;
  }
}

export async function saveFaq(params: {
  actorUserId: string;
  id?: string;
  question: string;
  answerMarkdown: string;
  displayOrder: number;
  status: ContentStatus;
}) {
  const competition = await requireProductionCompetition();
  const question = params.question.trim();
  const answerMarkdown = params.answerMarkdown.trim();
  if (!question) throw new Error("Cần câu hỏi.");
  if (!answerMarkdown) throw new Error("Cần câu trả lời.");
  const faq = params.id
    ? await prisma.fAQ.update({
        where: { id: params.id },
        data: {
          question,
          answerMarkdown,
          displayOrder: params.displayOrder,
          status: params.status,
        },
      })
    : await prisma.fAQ.create({
        data: {
          competitionId: competition.id,
          question,
          answerMarkdown,
          displayOrder: params.displayOrder,
          status: params.status,
        },
      });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: competition.id,
    action: params.id ? "content.faq.update" : "content.faq.create",
    entityType: "FAQ",
    entityId: faq.id,
    after: { status: params.status },
  });
  return faq;
}

export async function saveTimelineItem(params: {
  actorUserId: string;
  id?: string;
  title: string;
  description: string;
  startAt: Date | null;
  endAt: Date | null;
  statusLabel: string;
  displayOrder: number;
  status: ContentStatus;
}) {
  const competition = await requireProductionCompetition();
  const title = params.title.trim();
  const description = params.description.trim();
  const statusLabel = params.statusLabel.trim() || "Dự kiến";
  if (!title) throw new Error("Cần tiêu đề mốc lịch trình.");
  if (!description) throw new Error("Cần mô tả mốc lịch trình.");
  if (params.startAt && params.endAt && params.endAt < params.startAt) {
    throw new Error("Thời điểm kết thúc phải sau thời điểm bắt đầu.");
  }

  const item = params.id
    ? await prisma.timelineItem.update({
        where: { id: params.id, competitionId: competition.id },
        data: {
          title,
          description,
          startAt: params.startAt,
          endAt: params.endAt,
          statusLabel,
          displayOrder: params.displayOrder,
          status: params.status,
        },
      })
    : await prisma.timelineItem.create({
        data: {
          competitionId: competition.id,
          title,
          description,
          startAt: params.startAt,
          endAt: params.endAt,
          statusLabel,
          displayOrder: params.displayOrder,
          status: params.status,
        },
      });

  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: competition.id,
    action: params.id ? "content.timeline.update" : "content.timeline.create",
    entityType: "TimelineItem",
    entityId: item.id,
    after: { title, status: params.status, displayOrder: params.displayOrder },
  });
  return item;
}

export async function saveAnnouncement(params: {
  actorUserId: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  status: ContentStatus;
  publishAt?: Date | null;
}) {
  const competition = await requireProductionCompetition();
  const title = params.title.trim();
  if (!title) throw new Error("Cần tiêu đề tin.");
  const slug = requireContentSlug(params.slug, title);
  const publishedAt =
    params.status === "PUBLISHED" ? (params.publishAt ?? new Date()) : params.publishAt ?? null;
  try {
    const item = params.id
      ? await prisma.announcement.update({
          where: { id: params.id },
          data: {
            title,
            slug,
            excerpt: params.excerpt,
            bodyMarkdown: params.bodyMarkdown,
            status: params.status,
            publishAt: params.publishAt ?? undefined,
            publishedAt,
          },
        })
      : await prisma.announcement.create({
          data: {
            competitionId: competition.id,
            title,
            slug,
            excerpt: params.excerpt,
            bodyMarkdown: params.bodyMarkdown,
            status: params.status,
            publishAt: params.publishAt ?? undefined,
            publishedAt,
          },
        });
    await writeAuditLog({
      actorUserId: params.actorUserId,
      competitionId: competition.id,
      action: params.id ? "content.announcement.update" : "content.announcement.create",
      entityType: "Announcement",
      entityId: item.id,
      after: { slug, status: params.status },
    });
    return item;
  } catch (error) {
    if (isUniqueConflict(error)) throw new Error(`Slug "${slug}" đã được dùng. Chọn slug khác.`);
    throw error;
  }
}

export async function deleteStaticPage(params: { actorUserId: string; id: string; reason: string }) {
  const page = await prisma.staticPage.findUnique({ where: { id: params.id } });
  if (!page) throw new Error("Không tìm thấy trang.");
  await prisma.staticPage.delete({ where: { id: page.id } });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: page.competitionId,
    action: "content.static_page.delete",
    entityType: "StaticPage",
    entityId: page.id,
    reason: params.reason,
    before: { slug: page.slug, title: page.title },
  });
  return { slug: page.slug };
}

export async function deleteFaq(params: { actorUserId: string; id: string; reason: string }) {
  const faq = await prisma.fAQ.findUnique({ where: { id: params.id } });
  if (!faq) throw new Error("Không tìm thấy FAQ.");
  await prisma.fAQ.delete({ where: { id: faq.id } });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: faq.competitionId,
    action: "content.faq.delete",
    entityType: "FAQ",
    entityId: faq.id,
    reason: params.reason,
    before: { question: faq.question },
  });
}

export async function deleteAnnouncement(params: { actorUserId: string; id: string; reason: string }) {
  const item = await prisma.announcement.findUnique({ where: { id: params.id } });
  if (!item) throw new Error("Không tìm thấy tin.");
  await prisma.announcement.delete({ where: { id: item.id } });
  await writeAuditLog({
    actorUserId: params.actorUserId,
    competitionId: item.competitionId,
    action: "content.announcement.delete",
    entityType: "Announcement",
    entityId: item.id,
    reason: params.reason,
    before: { slug: item.slug, title: item.title },
  });
  return { slug: item.slug };
}
