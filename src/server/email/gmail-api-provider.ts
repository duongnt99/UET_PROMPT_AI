import { getEnv } from "@/config/env";
import { logger } from "@/lib/logging";
import { EmailSendError } from "@/server/email/email-errors";
import { base64UrlEncode, buildMimeMessage } from "@/server/email/mime-message";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

type GmailApiEnv = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_GMAIL_USER: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function extractEmailAddress(value: string) {
  const match = value.match(/<([^<>]+)>$/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

export function getGmailApiConfig() {
  const env = getEnv();
  const missing: string[] = [];
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.GOOGLE_REFRESH_TOKEN) missing.push("GOOGLE_REFRESH_TOKEN");
  if (!env.GOOGLE_GMAIL_USER) missing.push("GOOGLE_GMAIL_USER");
  if (missing.length > 0) {
    return { ok: false as const, missing };
  }
  return {
    ok: true as const,
    config: {
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID!,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET!,
      GOOGLE_REFRESH_TOKEN: env.GOOGLE_REFRESH_TOKEN!,
      GOOGLE_GMAIL_USER: env.GOOGLE_GMAIL_USER!,
    },
  };
}

function mapOAuthError(error: string, description?: string) {
  const detail = description?.trim();
  switch (error) {
    case "invalid_grant":
      return new EmailSendError(
        detail
          ? `Refresh token Gmail API không hợp lệ hoặc đã hết hạn: ${detail}`
          : "Refresh token Gmail API không hợp lệ hoặc đã hết hạn. Cần ủy quyền lại tài khoản Google Workspace.",
      );
    case "insufficient_scope":
      return new EmailSendError(
        `OAuth thiếu quyền gửi email. Cần scope ${GMAIL_SEND_SCOPE}.`,
      );
    case "admin_policy_enforced":
      return new EmailSendError(
        "Google Workspace chặn ứng dụng OAuth này. Liên hệ quản trị viên để cho phép ứng dụng hoặc scope gmail.send.",
      );
    case "access_denied":
      return new EmailSendError("Google từ chối quyền truy cập Gmail API cho ứng dụng này.");
    case "invalid_client":
      return new EmailSendError("GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET không hợp lệ.");
    default:
      return new EmailSendError(
        detail ? `Làm mới access token Gmail API thất bại (${error}): ${detail}` : `Làm mới access token Gmail API thất bại (${error}).`,
      );
  }
}

function mapGmailApiHttpError(status: number, payload: { error?: { message?: string; status?: string; errors?: Array<{ reason?: string; message?: string }> } }) {
  const apiMessage = payload.error?.message?.trim();
  const reason = payload.error?.errors?.[0]?.reason;
  const detail = apiMessage || reason || `HTTP ${status}`;

  if (status === 401) {
    cachedAccessToken = null;
    return new EmailSendError(`Gmail API từ chối xác thực (401): ${detail}`, true);
  }
  if (status === 403) {
    if (reason === "rateLimitExceeded" || reason === "userRateLimitExceeded") {
      return new EmailSendError(`Gmail API giới hạn tần suất (403): ${detail}`, true);
    }
    return new EmailSendError(`Gmail API từ chối quyền truy cập (403): ${detail}`);
  }
  if (status === 429) {
    return new EmailSendError(`Gmail API quá tải (429): ${detail}`, true);
  }
  if (status >= 500) {
    return new EmailSendError(`Gmail API lỗi máy chủ (${status}): ${detail}`, true);
  }
  return new EmailSendError(`Gmail API từ chối gửi email (${status}): ${detail}`);
}

async function refreshAccessToken(config: GmailApiEnv, force = false) {
  if (!force && cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        refresh_token: config.GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new EmailSendError(
      error instanceof Error ? error.message : "Không kết nối được Google OAuth.",
      true,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    logger.warn("Gmail API token refresh failed", {
      status: response.status,
      error: payload.error ?? "unknown",
    });
    if (payload.error) throw mapOAuthError(payload.error, payload.error_description);
    throw new EmailSendError(`Làm mới access token Gmail API thất bại (HTTP ${response.status}).`, response.status >= 500);
  }

  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return payload.access_token;
}

export async function sendViaGmailApi(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  deliveryId: string;
}) {
  const configResult = getGmailApiConfig();
  if (!configResult.ok) {
    throw new EmailSendError(`Thiếu cấu hình Gmail API: ${configResult.missing.join(", ")}.`);
  }
  const config = configResult.config;

  const fromAddress = extractEmailAddress(input.from);
  const authorizedUser = config.GOOGLE_GMAIL_USER.trim().toLowerCase();
  if (fromAddress !== authorizedUser) {
    throw new EmailSendError(
      `Địa chỉ gửi (${fromAddress}) phải khớp GOOGLE_GMAIL_USER (${authorizedUser}).`,
    );
  }

  const raw = base64UrlEncode(
    buildMimeMessage({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      messageId: input.deliveryId,
    }),
  );

  const sendOnce = async (forceRefresh: boolean) => {
    const accessToken = await refreshAccessToken(config, forceRefresh);
    let response: Response;
    try {
      response = await fetch(GMAIL_SEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      throw new EmailSendError(
        error instanceof Error ? error.message : "Không kết nối được Gmail API.",
        true,
      );
    }

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: { message?: string; status?: string; errors?: Array<{ reason?: string; message?: string }> };
    };

    if (!response.ok) {
      throw mapGmailApiHttpError(response.status, payload);
    }
    return payload.id ?? null;
  };

  try {
    const messageId = await sendOnce(false);
    return { messageId };
  } catch (error) {
    if (error instanceof EmailSendError && error.transient) {
      const messageId = await sendOnce(true);
      return { messageId };
    }
    throw error;
  }
}
