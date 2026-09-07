import { z } from "zod";
import { normalizeEmail } from "@/lib/utils";

export const emailRecipientTypes = ["ALL_USERS", "ALL_PARTICIPANTS", "SPECIFIC_USERS"] as const;
export type EmailRecipientTypeValue = (typeof emailRecipientTypes)[number];

export const adminEmailSchema = z
  .object({
    recipientType: z.enum(emailRecipientTypes, { message: "Đối tượng nhận không hợp lệ." }),
    subject: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tiêu đề email.")
      .max(180, "Tiêu đề không được vượt quá 180 ký tự.")
      .refine((value) => !/[\r\n]/.test(value), "Tiêu đề không được chứa ký tự xuống dòng."),
    content: z.string().trim().min(1, "Vui lòng nhập nội dung email.").max(20_000, "Nội dung email quá dài."),
    userIds: z.array(z.string().min(1)).max(500).default([]),
    idempotencyKey: z.string().uuid("Mã xác nhận gửi không hợp lệ."),
  })
  .refine(({ recipientType, userIds }) => recipientType !== "SPECIFIC_USERS" || userIds.length > 0, {
    message: "Vui lòng chọn ít nhất một người dùng.",
    path: ["userIds"],
  });

export function isDeliverableEmail(value: string): boolean {
  return z.string().email().safeParse(normalizeEmail(value)).success;
}

export function escapeEmailHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderAdminEmail(content: string): { text: string; html: string } {
  const text = content.trim();
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.6">${escapeEmailHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
  return {
    text,
    html: `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #dbe3ee;border-radius:16px"><tr><td style="padding:24px;background:#0b1f3a;color:#fff;border-radius:16px 16px 0 0;font-size:20px;font-weight:700">AI Arena Vietnam</td></tr><tr><td style="padding:28px">${paragraphs}<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;line-height:1.5">Đây là email được gửi từ Ban tổ chức AI Arena Vietnam.</p></td></tr></table></td></tr></table></body></html>`,
  };
}

export function dedupeRecipients<T extends { email: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const email = normalizeEmail(row.email);
    if (!isDeliverableEmail(email) || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

export function finalBatchStatus(successCount: number, failedCount: number) {
  if (successCount > 0 && failedCount > 0) return "PARTIALLY_FAILED" as const;
  if (failedCount > 0) return "FAILED" as const;
  return "COMPLETED" as const;
}
