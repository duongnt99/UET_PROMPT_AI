import { notFound } from "next/navigation";
import { MatchDetailView } from "@/components/live/match-detail/match-detail-view";
import { getPublicMatchDetail } from "@/server/services/public-match-service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Chi tiết trận đấu" };

export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const detail = await getPublicMatchDetail(matchId);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <MatchDetailView initialData={detail} />
    </div>
  );
}
