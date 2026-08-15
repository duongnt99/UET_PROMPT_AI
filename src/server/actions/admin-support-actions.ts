"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { normalizePasswordInput } from "@/lib/auth/password";
import {
  adminChangeUserEmail,
  adminRenameTeam,
  adminSetUserPassword,
} from "@/server/services/admin-account-service";
import { adminChangeRegistrationStatus } from "@/server/services/registration-service";

export type AdminSupportState = { ok: boolean; message: string };

function fail(error: unknown): AdminSupportState {
  return { ok: false, message: error instanceof Error ? error.message : "Không thực hiện được." };
}

function refreshRegistration(registrationId: string) {
  revalidatePath(`/admin/registrations/${registrationId}`);
  revalidatePath("/admin/registrations");
}

export async function renameTeamAction(
  _prev: AdminSupportState,
  formData: FormData,
): Promise<AdminSupportState> {
  const user = await requirePermission("registration:manage");
  const registrationId = String(formData.get("registrationId") ?? "");
  try {
    const result = await adminRenameTeam({
      actorUserId: user.id,
      registrationId,
      teamName: String(formData.get("teamName") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    refreshRegistration(registrationId);
    return { ok: true, message: `Đã đổi tên đội thành “${result.teamName}”.` };
  } catch (error) {
    return fail(error);
  }
}

export async function setMemberPasswordAction(
  _prev: AdminSupportState,
  formData: FormData,
): Promise<AdminSupportState> {
  const user = await requirePermission("users:manage");
  const registrationId = String(formData.get("registrationId") ?? "");
  const password = normalizePasswordInput(String(formData.get("password") ?? ""));
  const confirm = normalizePasswordInput(String(formData.get("confirmPassword") ?? ""));
  if (password !== confirm) return { ok: false, message: "Mật khẩu nhập lại không khớp." };
  try {
    await adminSetUserPassword({
      actorUserId: user.id,
      registrationId,
      userId: String(formData.get("userId") ?? ""),
      password,
      reason: String(formData.get("reason") ?? ""),
    });
    refreshRegistration(registrationId);
    return { ok: true, message: "Đã đặt mật khẩu mới. Gửi mật khẩu cho thí sinh qua kênh riêng, không nhắn trên hệ thống." };
  } catch (error) {
    return fail(error);
  }
}

export async function changeMemberEmailAction(
  _prev: AdminSupportState,
  formData: FormData,
): Promise<AdminSupportState> {
  const user = await requirePermission("users:manage");
  const registrationId = String(formData.get("registrationId") ?? "");
  try {
    await adminChangeUserEmail({
      actorUserId: user.id,
      registrationId,
      userId: String(formData.get("userId") ?? ""),
      email: String(formData.get("email") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    refreshRegistration(registrationId);
    return { ok: true, message: "Đã đổi email đăng nhập." };
  } catch (error) {
    return fail(error);
  }
}

export async function changeRegistrationStatusAction(
  _prev: AdminSupportState,
  formData: FormData,
): Promise<AdminSupportState> {
  const user = await requirePermission("registration:manage");
  const registrationId = String(formData.get("registrationId") ?? "");
  try {
    await adminChangeRegistrationStatus({
      actorUserId: user.id,
      registrationId,
      toStatus: String(formData.get("toStatus")) as "NEEDS_UPDATE",
      reason: String(formData.get("reason") ?? ""),
    });
    refreshRegistration(registrationId);
    return { ok: true, message: "Đã cập nhật trạng thái hồ sơ." };
  } catch (error) {
    return fail(error);
  }
}
