import { z } from "zod";
import { normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";

export const registrationCredentialsSchema = z
  .object({
    email: z
      .string()
      .transform(normalizeEmail)
      .pipe(z.string().email("Email không hợp lệ.")),
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
