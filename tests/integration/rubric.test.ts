import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { rubricWeightsSumTo100 } from "@/server/domain/scoring";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("seeded competition data", () => {
  it("has an active audition rubric whose weights sum to 100", async () => {
    const rubric = await prisma.rubric.findFirst({
      where: { stage: "AUDITION", isActive: true },
      include: { criteria: true },
    });
    expect(rubric).not.toBeNull();
    expect(rubricWeightsSumTo100(rubric!.criteria.map((c) => c.weight.toString()))).toBe(true);
    await prisma.$disconnect();
  });
});
