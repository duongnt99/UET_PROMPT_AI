import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assertCanWatchLiveScreen } from "@/server/domain/live-screen";
import type { Role } from "@/server/domain/permissions";
import { getCurrentMatchDualScreenContext } from "@/server/services/live-screen-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  try {
    assertCanWatchLiveScreen(session.user.roles as Role[]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không có quyền theo dõi màn hình." },
      { status: 403 },
    );
  }
  const context = await getCurrentMatchDualScreenContext();
  return NextResponse.json(context, { headers: { "Cache-Control": "private, no-store" } });
}
