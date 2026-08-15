import { NextResponse } from "next/server";
import { getProductionCompetition } from "@/server/services/competition-service";
import { listPublishedFinalists } from "@/server/services/finalist-service";

export async function GET() {
  const competition = await getProductionCompetition();
  if (!competition?.settings.finalistPublicationEnabled) {
    return NextResponse.json({ items: [] });
  }
  const items = await listPublishedFinalists(competition.id);
  return NextResponse.json({
    items: items.map((item) => ({
      displayName: item.displayName,
      institution: item.institutionPublic,
      seed: item.seed,
    })),
  });
}
