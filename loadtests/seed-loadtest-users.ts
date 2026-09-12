/**
 * Create a small pool of load-test participant accounts on production.
 *
 * Usage (on server, inside app container):
 *   LOADTEST_POOL_SIZE=30 LOADTEST_PASSWORD='LoadTestPass123!' \\
 *     corepack pnpm exec tsx scripts/seed-loadtest-users.ts
 */
import { hashPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/db/prisma";

const prefix = process.env.LOADTEST_EMAIL_PREFIX ?? "loadtest-20260910";
const poolSize = Number(process.env.LOADTEST_POOL_SIZE ?? "30");
const password = process.env.LOADTEST_PASSWORD ?? "LoadTestPass123!";

async function main() {
  if (password.length < 10) {
    throw new Error("LOADTEST_PASSWORD must be at least 10 characters.");
  }
  const passwordHash = await hashPassword(password);
  let created = 0;
  let existing = 0;
  for (let index = 1; index <= poolSize; index += 1) {
    const email = `${prefix}-pool-${String(index).padStart(2, "0")}@example.com`;
    const found = await prisma.user.findUnique({ where: { emailNormalized: email } });
    if (found) {
      existing += 1;
      continue;
    }
    await prisma.user.create({
      data: {
        email,
        emailNormalized: email,
        passwordHash,
        status: "ACTIVE",
        roleAssignments: { create: { role: "PARTICIPANT" } },
        profile: { create: {} },
      },
    });
    created += 1;
  }
  console.info(`LOADTEST_USERS created=${created} existing=${existing} prefix=${prefix}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
