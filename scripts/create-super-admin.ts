import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_SEED_PASSWORD must be at least 12 characters");
  }
  const emailNormalized = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { emailNormalized },
    update: { passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
    create: {
      email,
      emailNormalized,
      name: "SUPER_ADMIN",
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  const existing = await prisma.roleAssignment.findFirst({
    where: { userId: user.id, role: "SUPER_ADMIN", revokedAt: null },
  });
  if (!existing) {
    await prisma.roleAssignment.create({ data: { userId: user.id, role: "SUPER_ADMIN" } });
  }
  console.info("SUPER_ADMIN ready:", emailNormalized);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
