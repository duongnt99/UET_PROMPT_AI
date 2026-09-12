/**
 * Verify SMTP credentials from environment variables.
 *
 * Usage:
 *   pnpm exec tsx scripts/test-smtp-connection.ts
 */
import "dotenv/config";
import nodemailer from "nodemailer";
import { getEnv } from "../src/config/env";

async function main() {
  const env = getEnv();
  if (env.EMAIL_PROVIDER !== "smtp") {
    throw new Error(`EMAIL_PROVIDER must be smtp (current: ${env.EMAIL_PROVIDER ?? "unset"})`);
  }
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.EMAIL_FROM_ADDRESS) {
    throw new Error("Missing SMTP_HOST, SMTP_USER, or EMAIL_FROM_ADDRESS.");
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" },
    connectionTimeout: 15_000,
    socketTimeout: 20_000,
  });

  await transport.verify();
  console.info("SMTP verify OK:", env.SMTP_HOST, env.SMTP_USER, env.EMAIL_FROM_ADDRESS);
}

main().catch((error) => {
  console.error("SMTP verify failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
