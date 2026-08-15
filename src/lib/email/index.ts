import { getEnv } from "@/config/env";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/logging";
import nodemailer from "nodemailer";

export type EmailTemplateCode =
  | "verify_email"
  | "reset_password"
  | "team_invite"
  | "registration_confirm"
  | "registration_update_request"
  | "submission_confirm"
  | "submission_reopened"
  | "audition_result"
  | "finalist_notice"
  | "reviewer_invite"
  | "judge_invite"
  | "review_reminder"
  | "schedule_change";

export async function enqueueEmail(params: {
  toEmail: string;
  templateCode: EmailTemplateCode;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}) {
  await prisma.emailOutbox.upsert({
    where: { idempotencyKey: params.idempotencyKey },
    update: {},
    create: {
      toEmail: params.toEmail,
      templateCode: params.templateCode,
      payload: params.payload as Prisma.InputJsonValue,
      idempotencyKey: params.idempotencyKey,
      status: "PENDING",
    },
  });
}

function transporter() {
  const env = getEnv();
  return nodemailer.createTransport({
    host: env.SMTP_HOST || "localhost",
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });
}

export function renderEmail(templateCode: EmailTemplateCode, payload: Record<string, unknown>) {
  const appUrl = getEnv().APP_URL;
  const name = String(payload.name ?? "bạn");
  const templates: Record<EmailTemplateCode, { subject: string; text: string }> = {
    verify_email: {
      subject: "Xác minh email — Prompt-Off: Vietnam 2026",
      text: `Xin chào ${name},\n\nVui lòng xác minh email bằng liên kết sau:\n${payload.verifyUrl}\n\nLiên kết có hiệu lực trong 24 giờ.`,
    },
    reset_password: {
      subject: "Đặt lại mật khẩu — Prompt-Off: Vietnam 2026",
      text: `Xin chào ${name},\n\nNếu bạn yêu cầu đặt lại mật khẩu, hãy dùng liên kết:\n${payload.resetUrl}\n\nNếu không phải bạn, hãy bỏ qua email này.`,
    },
    team_invite: {
      subject: "Lời mời tham gia đội thi Prompt-Off",
      text: `Bạn được mời vào đội ${payload.teamName}.\nMở liên kết để chấp nhận: ${payload.inviteUrl}`,
    },
    registration_confirm: {
      subject: `Xác nhận đăng ký ${payload.code}`,
      text: `Hồ sơ đăng ký ${payload.code} đã được nộp lúc ${payload.submittedAt}.\nXem biên nhận: ${appUrl}/dashboard/bien-nhan`,
    },
    registration_update_request: {
      subject: "Yêu cầu cập nhật hồ sơ đăng ký",
      text: `Ban Tổ chức yêu cầu bạn cập nhật hồ sơ. Lý do: ${payload.reason}\n${appUrl}/dashboard/dang-ky`,
    },
    submission_confirm: {
      subject: "Đã nhận bài Audition",
      text: `Bài Audition đã được nộp. Xem biên nhận tại ${appUrl}/dashboard/bien-nhan`,
    },
    submission_reopened: {
      subject: "Bài Audition được mở lại để chỉnh sửa",
      text: `Bài của bạn được mở lại. Lý do: ${payload.reason}`,
    },
    audition_result: {
      subject: "Kết quả vòng tuyển chọn Prompt-Off",
      text: String(payload.message ?? "Kết quả vòng tuyển chọn đã được cập nhật."),
    },
    finalist_notice: {
      subject: "Chúc mừng — bạn vào vòng chung kết",
      text: `Bạn/đội đã được chọn vào chung kết Prompt-Off: Vietnam 2026.\nChi tiết: ${appUrl}/dashboard`,
    },
    reviewer_invite: {
      subject: "Lời mời làm Reviewer Prompt-Off",
      text: `Bạn được mời làm reviewer. Tham gia: ${payload.inviteUrl}`,
    },
    judge_invite: {
      subject: "Lời mời làm Giám khảo Prompt-Off",
      text: `Bạn được mời làm giám khảo. Tham gia: ${payload.inviteUrl}`,
    },
    review_reminder: {
      subject: "Nhắc hoàn thành phần chấm",
      text: `Bạn còn bài chưa hoàn thành. Vào hệ thống: ${appUrl}`,
    },
    schedule_change: {
      subject: "Thông báo thay đổi lịch",
      text: String(payload.message ?? "Lịch thi có cập nhật. Vui lòng kiểm tra website."),
    },
  };
  return templates[templateCode];
}

export async function processEmailOutbox(limit = 20) {
  const jobs = await prisma.emailOutbox.findMany({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  const env = getEnv();
  for (const job of jobs) {
    await prisma.emailOutbox.update({
      where: { id: job.id },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    try {
      const rendered = renderEmail(job.templateCode as EmailTemplateCode, job.payload as Record<string, unknown>);
      await transporter().sendMail({
        from: env.EMAIL_FROM,
        to: job.toEmail,
        subject: rendered.subject,
        text: rendered.text,
      });
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: { status: "SENT", sentAt: new Date(), lastError: null },
      });
    } catch (error) {
      logger.error("Email send failed", { id: job.id, error: String(error) });
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= 5 ? "FAILED" : "PENDING",
          lastError: String(error).slice(0, 500),
        },
      });
    }
  }
}
