"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { registerAccount } from "@/server/services/auth-service";
import { resolvePostLoginPath } from "@/server/domain/permissions";
import { normalizePasswordInput } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/utils";
import { AuthError } from "next-auth";
import { registrationCredentialsSchema } from "@/server/domain/auth-registration";

export async function registerAction(formData: FormData) {
  const parsed = registrationCredentialsSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  return registerAccount({ email: parsed.data.email, password: parsed.data.password });
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
