/**
 * Rename display text "Vietnam" -> "Viet Nam" in production data (idempotent).
 *
 * Usage:
 *   pnpm exec tsx scripts/apply-vietnam-rename-production.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function renameDisplayText(value: string) {
  return value.replaceAll("Vietnam", "Viet Nam");
}

async function main() {
  const competitions = await prisma.competition.findMany();
  for (const competition of competitions) {
    const settings = JSON.parse(renameDisplayText(JSON.stringify(competition.settings))) as typeof competition.settings;
    settings.officialContactEmail = "ai_arena_vietnam@vnu.edu.vn";
    await prisma.competition.update({
      where: { id: competition.id },
      data: {
        name: renameDisplayText(competition.name),
        settings,
      },
    });
  }

  for (const page of await prisma.staticPage.findMany()) {
    await prisma.staticPage.update({
      where: { id: page.id },
      data: {
        title: renameDisplayText(page.title),
        bodyMarkdown: renameDisplayText(page.bodyMarkdown),
      },
    });
  }

  for (const faq of await prisma.fAQ.findMany()) {
    await prisma.fAQ.update({
      where: { id: faq.id },
      data: {
        question: renameDisplayText(faq.question),
        answerMarkdown: renameDisplayText(faq.answerMarkdown),
      },
    });
  }

  for (const item of await prisma.announcement.findMany()) {
    await prisma.announcement.update({
      where: { id: item.id },
      data: {
        title: renameDisplayText(item.title),
        excerpt: renameDisplayText(item.excerpt),
        bodyMarkdown: renameDisplayText(item.bodyMarkdown),
      },
    });
  }

  console.info("Renamed display text in production content.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
