/**
 * Verify Gmail API OAuth credentials and optionally send a test message.
 *
 * Usage:
 *   pnpm exec tsx scripts/test-gmail-api-connection.ts
 *   pnpm exec tsx scripts/test-gmail-api-connection.ts user@example.com
 */
import "dotenv/config";
import { getEnv } from "../src/config/env";
import { getGmailApiConfig } from "../src/server/email/gmail-api-provider";
import { sendEmail } from "../src/server/email/email-service";

async function main() {
  const env = getEnv();
  if (env.EMAIL_PROVIDER !== "gmail-api") {
    throw new Error(`EMAIL_PROVIDER must be gmail-api (current: ${env.EMAIL_PROVIDER ?? "unset"})`);
  }

  const config = getGmailApiConfig();
  if (!config.ok) {
    throw new Error(`Missing Gmail API config: ${config.missing.join(", ")}`);
  }
  if (!env.EMAIL_FROM && !env.EMAIL_FROM_ADDRESS) {
    throw new Error("Set EMAIL_FROM or EMAIL_FROM_ADDRESS for the sender address.");
  }

  const testRecipient = process.argv[2]?.trim();
  if (!testRecipient) {
    console.info("Gmail API config OK.");
    console.info("Authorized mailbox:", config.config.GOOGLE_GMAIL_USER);
    console.info("To send a test email, pass a recipient address as the first argument.");
    return;
  }

  const result = await sendEmail({
    to: testRecipient,
    subject: "AI Arena Viet Nam — Gmail API test",
    text: "This is a Gmail API connectivity test from AI Arena Viet Nam.",
    html: "<p>This is a Gmail API connectivity test from <strong>AI Arena Viet Nam</strong>.</p>",
    deliveryId: `gmail-api-test-${Date.now()}`,
  });
  console.info("Gmail API test email accepted. Message ID:", result.messageId ?? "(none)");
}

main().catch((error) => {
  console.error("Gmail API test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
