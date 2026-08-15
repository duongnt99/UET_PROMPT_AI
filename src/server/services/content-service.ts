import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getActiveRubric } from "@/server/services/review-service";

export async function getPublicHomeData() {
  const competition = await getProductionCompetition();
  if (!competition) return null;
  const [faqs, timeline, news, pages, partners, rubric] = await Promise.all([
    prisma.fAQ.findMany({
      where: { competitionId: competition.id, status: "PUBLISHED" },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.timelineItem.findMany({
      where: { competitionId: competition.id, status: "PUBLISHED" },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.announcement.findMany({
      where: { competitionId: competition.id, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.staticPage.findMany({ where: { competitionId: competition.id, status: "PUBLISHED" } }),
    prisma.partnerAsset.findMany({
      where: { competitionId: competition.id },
      orderBy: { displayOrder: "asc" },
    }),
    getActiveRubric(competition.id, "AUDITION"),
  ]);
  return { competition, faqs, timeline, news, pages, partners, rubric };
}

export async function getPublishedPage(slug: string) {
  const competition = await getProductionCompetition();
  if (!competition) return null;
  return prisma.staticPage.findUnique({
    where: { competitionId_slug: { competitionId: competition.id, slug } },
  });
}
