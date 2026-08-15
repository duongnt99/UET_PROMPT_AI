import { NextResponse } from "next/server";
import { processEmailOutbox } from "@/lib/email";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await processEmailOutbox(50);
  return NextResponse.json({ ok: true });
}
