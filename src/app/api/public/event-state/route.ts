import { NextResponse } from "next/server";
import { getProductionCompetition } from "@/server/services/competition-service";
import { publicEventState } from "@/server/services/match-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const competition = await getProductionCompetition();
  if (!competition) return NextResponse.json({ match: null });
  const state = await publicEventState(competition.id);
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  });
}
