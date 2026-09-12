import { NextResponse } from "next/server";
import { getPublicMatchDetail } from "@/server/services/public-match-service";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await context.params;
  const detail = await getPublicMatchDetail(matchId);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE_HEADERS });
  }
  return NextResponse.json(detail, { headers: NO_STORE_HEADERS });
}
