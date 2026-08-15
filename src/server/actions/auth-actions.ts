"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import {
  registerAccount,
  requestPasswordReset,
  resetPassword,
  verifyEmailToken,
} from "@/server/services/auth-service";
import { processEmailOutbox } from "@/lib/email";
import { resolvePostLoginPath } from "@/server/domain/permissions";
import { normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().transform(normalizeEmail).pipe(z.string().email()),
  password: z.string().transform(normalizePasswordInput).pipe(z.string().min(10)),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "Dữ liệu không hợp lệ." };
  const result = await registerAccount(parsed.data);
  if (result.ok) void processEmailOutbox();
  return result;
}

export async function loginAction(formData: FormData) {
  try {
    const result = await signIn("credentials", {
      email: normalizeEmail(String(formData.get("email") ?? "")),
      password: normalizePasswordInput(String(formData.get("password") ?? "")),
      redirect: false,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      return { ok: false, message: "Email hoặc mật khẩu không đúng." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Email hoặc mật khẩu không đúng." };
    }
    throw error;
  }
  const session = await auth();
  redirect(resolvePostLoginPath(String(formData.get("from") ?? ""), session?.user.roles ?? []));
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  await requestPasswordReset(email);
  void processEmailOutbox();
  return {
    ok: true,
    message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
  };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = normalizePasswordInput(String(formData.get("password") ?? ""));
  return resetPassword(token, password);
}

export async function verifyEmailAction(token: string) {
  return verifyEmailToken(token);
}
