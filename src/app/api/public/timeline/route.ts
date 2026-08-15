import { NextResponse } from "next/server";
import { getPublicHomeData } from "@/server/services/content-service";

export async function GET() {
  const data = await getPublicHomeData();
  return NextResponse.json({
    items: (data?.timeline ?? []).map((item) => ({
      title: item.title,
      description: item.description,
      statusLabel: item.statusLabel,
      startAt: item.startAt,
      endAt: item.endAt,
    })),
  });
}
