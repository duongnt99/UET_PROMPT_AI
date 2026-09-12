import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";
import { FormattedText } from "@/components/public/formatted-text";
import { ParticipantGuidePage } from "@/components/public/tin-tuc/participant-guide-page";
import { Card } from "@/components/ui/form";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const PARTICIPANT_GUIDE_SLUG = "huong-dan-dang-ky-va-audition";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === PARTICIPANT_GUIDE_SLUG) {
    return {
      title: "Hướng dẫn đăng ký và nộp bài Audition",
      description:
        "Hướng dẫn từng bước cho thí sinh AI Arena Vietnam 2026: đăng nhập, hoàn thiện hồ sơ, đăng ký đội và nộp bài Audition.",
    };
  }
  return { title: slug };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === PARTICIPANT_GUIDE_SLUG) {
    return <ParticipantGuidePage />;
  }

  const competition = await getProductionCompetition();
  if (!competition) notFound();
  const item = await prisma.announcement.findUnique({
    where: { competitionId_slug: { competitionId: competition.id, slug } },
  });
  if (!item || item.status !== "PUBLISHED") notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl">{item.title}</h1>
      <Card className="mt-6">
        <FormattedText text={item.bodyMarkdown} className="leading-7 text-slate-700" />
      </Card>
    </div>
  );
}
