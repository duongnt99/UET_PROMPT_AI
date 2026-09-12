import { z } from "zod";
import { normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .transform(normalizeEmail)
    .pipe(z.string().min(1, "Vui lòng nhập email.").email("Email không hợp lệ.")),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Liên kết đặt lại mật khẩu không hợp lệ."),
    password: z
      .string()
      .transform(normalizePasswordInput)
      .pipe(z.string().min(10, "Mật khẩu cần tối thiểu 10 ký tự.")),
    confirmPassword: z
      .string()
      .transform(normalizePasswordInput)
      .pipe(z.string().min(1, "Vui lòng nhập lại mật khẩu.")),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .transform(normalizePasswordInput)
      .pipe(z.string().min(1, "Vui lòng nhập mật khẩu hiện tại.")),
    password: z
      .string()
      .transform(normalizePasswordInput)
      .pipe(z.string().min(10, "Mật khẩu mới cần tối thiểu 10 ký tự.")),
    confirmPassword: z
      .string()
      .transform(normalizePasswordInput)
      .pipe(z.string().min(1, "Vui lòng nhập lại mật khẩu mới.")),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export const resendVerificationSchema = forgotPasswordSchema;
