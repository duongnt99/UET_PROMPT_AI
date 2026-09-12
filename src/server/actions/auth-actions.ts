"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import {
  changePassword,
  registerAccount,
  requestPasswordReset,
  resendVerificationEmail,
} from "@/server/services/auth-service";
import { resetPasswordWithToken } from "@/server/services/auth-token-service";
import { resolvePostLoginPath } from "@/server/domain/permissions";
import { normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";
import { AuthError } from "next-auth";
import { registrationCredentialsSchema } from "@/server/domain/auth-registration";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "@/server/domain/auth-password";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function registerAction(formData: FormData) {
  const parsed = registrationCredentialsSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  const result = await registerAccount({ email: parsed.data.email, password: parsed.data.password });
  if (!result.ok) return result;
  const email = encodeURIComponent(parsed.data.email);
  const sent = result.emailSent ? "1" : "0";
  redirect(`/xac-minh-email?sent=${sent}&email=${email}`);
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const user = await prisma.user.findUnique({ where: { emailNormalized: email } });
  if (user?.status === "PENDING_VERIFICATION") {
    return {
      ok: false,
      message: "Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư hoặc gửi lại email xác minh.",
    };
  }

  try {
    const result = await signIn("credentials", {
      email,
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
  const parsed = forgotPasswordSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  const result = await requestPasswordReset(parsed.data.email);
  return { ok: result.ok, message: result.message };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result.ok) return result;
  redirect("/dang-nhap?reset=1");
}

export async function resendVerificationAction(formData: FormData) {
  const parsed = resendVerificationSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  return resendVerificationEmail(parsed.data.email);
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  if (parsed.data.currentPassword === parsed.data.password) {
    return { ok: false, message: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  }
  return changePassword({
    userId: user.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.password,
  });
}
