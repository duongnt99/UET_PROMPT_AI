import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, type Role } from "@/server/domain/permissions";
import { getMatchTimerStates } from "@/server/services/match-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  if (!hasPermission(session.user.roles as Role[], "stage:control")) {
    return NextResponse.json({ error: "Không có quyền điều khiển đồng hồ." }, { status: 403 });
  }

  const { matchId } = await params;
  const timers = await getMatchTimerStates(matchId);
  return NextResponse.json(
    { timers },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
