"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { assertDeleteConfirmation } from "@/server/domain/admin-delete";
import {
  createStaffUser,
  deleteStaffUser,
  revokeStaffRole,
  updateStaffUser,
} from "@/server/services/admin-staff-service";
import { hardDeleteUser } from "@/server/services/admin-delete-service";
import { assignReviewerManually, unassignReviewer } from "@/server/services/review-service";
import { adminResetUserPassword } from "@/server/services/admin-account-service";
import { normalizePasswordInput } from "@/lib/auth/password";

export type StaffActionState = { ok: boolean; message: string };

function fail(error: unknown): StaffActionState {
  return { ok: false, message: error instanceof Error ? error.message : "Không thực hiện được." };
}

function refreshStaff() {
  revalidatePath("/admin/judges");
  revalidatePath("/admin/reviewers");
  revalidatePath("/admin/users");
  revalidatePath("/admin/review-assignments");
  revalidatePath("/judge");
  revalidatePath("/reviewer");
}

export async function createStaffAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("users:manage");
  try {
    const result = await createStaffUser({
      actorUserId: user.id,
      email: String(formData.get("email") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    refreshStaff();
    return {
      ok: true,
      message: result.created
        ? `Đã tạo tài khoản ${result.email}. Gửi mật khẩu qua kênh riêng.`
        : `Đã gán vai trò cho tài khoản có sẵn ${result.email}.`,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function updateStaffAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("users:manage");
  try {
    const password = String(formData.get("password") ?? "").trim();
    const result = await updateStaffUser({
      actorUserId: user.id,
      userId: String(formData.get("userId") ?? ""),
      email: String(formData.get("email") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      password: password || undefined,
      reason: String(formData.get("reason") ?? ""),
    });
    refreshStaff();
    return { ok: true, message: `Đã cập nhật ${result.email}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function revokeStaffRoleAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("users:manage");
  try {
    const result = await revokeStaffRole({
      actorUserId: user.id,
      userId: String(formData.get("userId") ?? ""),
      role: String(formData.get("role") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    refreshStaff();
    return { ok: true, message: `Đã gỡ vai trò ${result.role}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteStaffUserAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("users:manage");
  try {
    const reason = assertDeleteConfirmation({
      confirm: String(formData.get("confirm") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    const result = await deleteStaffUser({
      actorUserId: user.id,
      userId: String(formData.get("userId") ?? ""),
      role: String(formData.get("role") ?? ""),
      reason,
    });
    refreshStaff();
    return { ok: true, message: `Đã xóa hẳn ${result.email}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function hardDeleteUserAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("users:manage");
  try {
    const reason = assertDeleteConfirmation({
      confirm: String(formData.get("confirm") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    const result = await hardDeleteUser({
      actorUserId: user.id,
      userId: String(formData.get("userId") ?? ""),
      reason,
    });
    refreshStaff();
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/submissions");
    return { ok: true, message: `Đã xóa hẳn ${result.email}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function resetUserPasswordAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("users:manage");
  const password = normalizePasswordInput(String(formData.get("password") ?? ""));
  const confirmPassword = normalizePasswordInput(String(formData.get("confirmPassword") ?? ""));
  if (password !== confirmPassword) return { ok: false, message: "Mật khẩu nhập lại không khớp." };
  try {
    const result = await adminResetUserPassword({
      actorUserId: user.id,
      userId: String(formData.get("userId") ?? ""),
      password,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/users");
    return { ok: true, message: `Đã đặt mật khẩu mới cho ${result.email}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function assignReviewerAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("review:assign");
  try {
    const result = await assignReviewerManually({
      actorUserId: user.id,
      submissionId: String(formData.get("submissionId") ?? ""),
      reviewerId: String(formData.get("reviewerId") ?? ""),
    });
    revalidatePath("/admin/review-assignments");
    revalidatePath("/reviewer");
    return { ok: true, message: `Đã gán ${result.reviewerEmail} cho ${result.code}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function unassignReviewerAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const user = await requirePermission("review:assign");
  try {
    const result = await unassignReviewer({
      actorUserId: user.id,
      assignmentId: String(formData.get("assignmentId") ?? ""),
    });
    revalidatePath("/admin/review-assignments");
    revalidatePath("/reviewer");
    return { ok: true, message: `Đã gỡ phân công của ${result.code}.` };
  } catch (error) {
    return fail(error);
  }
}
