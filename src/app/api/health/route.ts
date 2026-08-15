import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { storageHealth } from "@/lib/storage";

export async function GET() {
  let database: "ok" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "error";
  }
  let storage: "ok" | "error" = "error";
  try {
    storage = await storageHealth();
  } catch {
    storage = "error";
  }
  const body = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    storage: process.env.NODE_ENV === "production" ? (storage === "ok" ? "ok" : "error") : storage,
  };
  return NextResponse.json(body, { status: database === "ok" ? 200 : 503 });
}
