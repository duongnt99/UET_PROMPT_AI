import { NextResponse } from "next/server";
import { getProductionCompetition } from "@/server/services/competition-service";
import { formatDate } from "@/lib/dates";

export async function GET() {
  const competition = await getProductionCompetition();
  if (!competition) return NextResponse.json({ error: "unavailable" }, { status: 404 });
  const s = competition.settings;
  return NextResponse.json({
    name: s.competitionName,
    season: s.season,
    shortDescription: s.shortDescription,
    venue: s.venueStatus === "TENTATIVE" ? `Dự kiến: ${s.venue}` : s.venue,
    eventDate: s.eventDateStatus === "TENTATIVE" ? `Dự kiến: ${s.eventDate ? formatDate(s.eventDate) : "Đang cập nhật"}` : formatDate(s.eventDate),
    registrationMode: s.registrationMode,
    prizeInformation: s.prizeInformation || "Đang cập nhật",
  });
}
