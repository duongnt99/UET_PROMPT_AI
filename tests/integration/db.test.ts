import { describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("database connectivity", () => {
  it("connects when DATABASE_URL is present", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.$queryRaw`SELECT 1 as n`;
    expect(Array.isArray(rows)).toBe(true);
    await prisma.$disconnect();
  });
});
