import { describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { assertSingleActiveRegistration } from "@/server/domain/registration-rules";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("registration uniqueness", () => {
  it("seeded students occupy at most one registration seat", async () => {
    const seats = await prisma.registrationSeat.groupBy({
      by: ["userId", "competitionId"],
      _count: true,
    });
    expect(seats.every((row) => row._count === 1)).toBe(true);
    expect(assertSingleActiveRegistration({ existingActiveCount: 1 }).ok).toBe(false);
  });

  it("hashes passwords rather than storing plaintext", async () => {
    const user = await prisma.user.findUnique({ where: { emailNormalized: "student1@promptoff.local" } });
    expect(user?.passwordHash).toBeTruthy();
    expect(user?.passwordHash).not.toBe("DevPassword123!");
    const hashed = await hashPassword("DevPassword123!");
    expect(hashed.startsWith("$2")).toBe(true);
  });
});
