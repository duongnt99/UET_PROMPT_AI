import { getEnv } from "@/config/env";
import { logger } from "@/lib/logging";
import nodemailer from "nodemailer";
import { isDeliverableEmail } from "@/server/domain/email";
import { EmailSendError } from "@/server/email/email-errors";
import { sendViaGmailApi } from "@/server/email/gmail-api-provider";

export { EmailSendError } from "@/server/email/email-errors";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  deliveryId: string;
};

function safeSenderName(value: string) {
  return value.replace(/[\r\n<>]/g, "").trim() || "AI Arena Viet Nam";
}

function resolveFromAddress(env: ReturnType<typeof getEnv>) {
  const from = env.EMAIL_FROM_ADDRESS
    ? `${safeSenderName(env.EMAIL_FROM_NAME)} <${env.EMAIL_FROM_ADDRESS}>`
    : env.EMAIL_FROM?.trim();
  const address = from?.match(/<([^<>]+)>$/)?.[1] ?? from;
  if (!from || /[\r\n]/.test(from) || !address || !isDeliverableEmail(address)) {
    throw new EmailSendError("Thiếu hoặc sai cấu hình địa chỉ người gửi email.");
  }
  return from;
}

export function getEmailProviderLabel(provider: string) {
  switch (provider) {
    case "gmail-api":
      return "Gmail API";
    case "smtp":
      return "SMTP";
    case "resend":
      return "Resend";
    case "console":
      return "Console (dev)";
    case "unconfigured":
      return "Chưa cấu hình";
    default:
      return provider;
  }
}

export function getEmailRuntimeInfo() {
  const env = getEnv();
  const provider = env.EMAIL_PROVIDER ?? (env.NODE_ENV === "production" ? undefined : "console");
  const localSmtp = provider === "smtp" && ["localhost", "127.0.0.1", "::1"].includes(env.SMTP_HOST ?? "");
  const resolvedProvider = provider ?? "unconfigured";
  return {
    provider: resolvedProvider,
    providerLabel: getEmailProviderLabel(resolvedProvider),
    localSmtp,
    localInboxUrl: localSmtp ? "http://localhost:8025" : null,
  };
}

export async function sendEmail(input: SendEmailInput): Promise<{ messageId: string | null }> {
  const env = getEnv();
  const provider = env.EMAIL_PROVIDER ?? (env.NODE_ENV === "production" ? undefined : "console");
  if (!provider) {
    throw new EmailSendError("Chưa cấu hình EMAIL_PROVIDER cho môi trường production.");
  }

  if (provider === "console") {
    if (env.NODE_ENV === "production") {
      throw new EmailSendError("Không được dùng console email transport trong production.");
    }
    logger.info("Development email accepted", { deliveryId: input.deliveryId, subject: input.subject });
    return { messageId: `console:${input.deliveryId}` };
  }

  const from = resolveFromAddress(env);

  if (provider === "smtp") {
    if (!env.SMTP_HOST) throw new EmailSendError("Thiếu SMTP_HOST.");
    try {
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE === "true",
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" } : undefined,
        connectionTimeout: 15_000,
        socketTimeout: 20_000,
      });
      const result = await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        headers: { "X-Entity-Ref-ID": input.deliveryId },
      });
      return { messageId: result.messageId || null };
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      const transient = ["ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ESOCKET"].includes(code);
      throw new EmailSendError(error instanceof Error ? error.message : "SMTP từ chối email.", transient);
    }
  }

  if (provider === "gmail-api") {
    return sendViaGmailApi({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      deliveryId: input.deliveryId,
    });
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
    throw new EmailSendError("Thiếu RESEND_API_KEY hoặc EMAIL_FROM_ADDRESS.");
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.deliveryId,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new EmailSendError(error instanceof Error ? error.message : "Không kết nối được email provider.", true);
  }

  const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (!response.ok) {
    const message = result.message || result.name || `Email provider trả về HTTP ${response.status}.`;
    throw new EmailSendError(message, response.status === 429 || response.status >= 500);
  }
  return { messageId: result.id ?? null };
}
