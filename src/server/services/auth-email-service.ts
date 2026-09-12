import { nanoid } from "nanoid";
import { getEnv } from "@/config/env";
import { logger } from "@/lib/logging";
import { escapeEmailHtml } from "@/server/domain/email";
import { sendEmail } from "@/server/email/email-service";

function buildAppUrl(path: string) {
  const base = getEnv().APP_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function transactionalEmailLayout(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="vi">
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeEmailHtml(title)}</h1>
      ${bodyHtml}
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;">AI Arena Vietnam 2026</p>
    </div>
  </body>
</html>`;
}

export async function sendVerificationEmail(params: { to: string; token: string }) {
  const verifyUrl = buildAppUrl(`/xac-minh-email?token=${encodeURIComponent(params.token)}`);
  const subject = "Xác minh email — AI Arena Vietnam 2026";
  const text = [
    "Xin chào,",
    "",
    "Cảm ơn bạn đã đăng ký tài khoản AI Arena Vietnam 2026.",
    "Vui lòng xác minh email bằng liên kết sau (có hiệu lực trong 24 giờ):",
    verifyUrl,
    "",
    "Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.",
  ].join("\n");
  const html = transactionalEmailLayout(
    "Xác minh email của bạn",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Cảm ơn bạn đã đăng ký tài khoản AI Arena Vietnam 2026. Vui lòng nhấn nút bên dưới để xác minh email (liên kết có hiệu lực trong 24 giờ).</p>
     <p style="margin:0 0 20px;"><a href="${verifyUrl}" style="display:inline-block;background:#4285F4;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">Xác minh email</a></p>
     <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">Hoặc mở liên kết: <a href="${verifyUrl}">${escapeEmailHtml(verifyUrl)}</a></p>`,
  );

  try {
    await sendEmail({
      to: params.to,
      subject,
      text,
      html,
      deliveryId: `verify:${nanoid()}`,
    });
    return { ok: true as const };
  } catch (error) {
    logger.error("Failed to send verification email", { to: params.to, error: String(error) });
    return { ok: false as const };
  }
}

export async function sendPasswordResetEmail(params: { to: string; token: string }) {
  const resetUrl = buildAppUrl(`/dat-lai-mat-khau?token=${encodeURIComponent(params.token)}`);
  const subject = "Đặt lại mật khẩu — AI Arena Vietnam 2026";
  const text = [
    "Xin chào,",
    "",
    "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản AI Arena Vietnam 2026.",
    "Mở liên kết sau để đặt mật khẩu mới (có hiệu lực trong 1 giờ):",
    resetUrl,
    "",
    "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.",
  ].join("\n");
  const html = transactionalEmailLayout(
    "Đặt lại mật khẩu",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tạo mật khẩu mới (liên kết có hiệu lực trong 1 giờ).</p>
     <p style="margin:0 0 20px;"><a href="${resetUrl}" style="display:inline-block;background:#4285F4;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">Đặt lại mật khẩu</a></p>
     <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">Hoặc mở liên kết: <a href="${resetUrl}">${escapeEmailHtml(resetUrl)}</a></p>`,
  );

  try {
    await sendEmail({
      to: params.to,
      subject,
      text,
      html,
      deliveryId: `reset:${nanoid()}`,
    });
    return { ok: true as const };
  } catch (error) {
    logger.error("Failed to send password reset email", { to: params.to, error: String(error) });
    return { ok: false as const };
  }
}
