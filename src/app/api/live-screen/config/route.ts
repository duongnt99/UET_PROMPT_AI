import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEnv } from "@/config/env";

function urls(value: string | undefined) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const env = getEnv();
  const iceServers: RTCIceServer[] = [];
  const stunUrls = urls(env.WEBRTC_STUN_URLS);
  if (stunUrls.length) iceServers.push({ urls: stunUrls });
  const turnUrls = urls(env.WEBRTC_TURN_URLS);
  if (turnUrls.length && env.WEBRTC_TURN_USERNAME && env.WEBRTC_TURN_CREDENTIAL) {
    iceServers.push({
      urls: turnUrls,
      username: env.WEBRTC_TURN_USERNAME,
      credential: env.WEBRTC_TURN_CREDENTIAL,
    });
  }
  return NextResponse.json(
    { iceServers, websocketPath: "/api/live-screen/socket" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
