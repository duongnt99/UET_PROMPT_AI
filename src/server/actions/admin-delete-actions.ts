"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { assertDeleteConfirmation } from "@/server/domain/admin-delete";
import { deleteMatch } from "@/server/services/match-service";
import {
  deleteRegistration,
  deleteSubmission,
  disableUserAccount,
  removeTeamMember,
} from "@/server/services/admin-delete-service";
import {
  deleteAnnouncement,
  deleteFaq,
  deleteStaticPage,
} from "@/server/services/admin-content-service";

export type AdminDeleteState = { ok: boolean; message: string };

function fail(error: unknown): AdminDeleteState {
  return { ok: false, message: error instanceof Error ? error.message : "Không xóa được." };
}

function confirm(formData: FormData) {
  return assertDeleteConfirmation({
    confirm: String(formData.get("confirm") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
}

export async function deleteMatchAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const reason = confirm(formData);
    await deleteMatch({ actorUserId: user.id, matchId, reason });
    revalidatePath("/admin/bracket");
    revalidatePath("/admin/scoring");
    revalidatePath("/admin/operations");
    revalidatePath("/judge");
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/bracket");
}

export async function deleteSubmissionAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("submission:manage");
  try {
    const reason = confirm(formData);
    await deleteSubmission({
      actorUserId: user.id,
      submissionId: String(formData.get("submissionId") ?? ""),
      reason,
    });
    revalidatePath("/admin/submissions");
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/submissions");
}

export async function deleteRegistrationAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("registration:manage");
  try {
    const reason = confirm(formData);
    await deleteRegistration({
      actorUserId: user.id,
      registrationId: String(formData.get("registrationId") ?? ""),
      reason,
    });
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/finalists");
    revalidatePath("/admin/submissions");
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/registrations");
}

export async function disableUserAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("users:manage");
  const registrationId = String(formData.get("registrationId") ?? "").trim();
  try {
    const reason = confirm(formData);
    const result = await disableUserAccount({
      actorUserId: user.id,
      userId: String(formData.get("userId") ?? ""),
      reason,
    });
    revalidatePath("/admin/users");
    if (registrationId) revalidatePath(`/admin/registrations/${registrationId}`);
    return { ok: true, message: `Đã vô hiệu hóa ${result.email}. Tài khoản không đăng nhập được.` };
  } catch (error) {
    return fail(error);
  }
}

export async function removeTeamMemberAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("registration:manage");
  const registrationId = String(formData.get("registrationId") ?? "");
  try {
    const reason = confirm(formData);
    await removeTeamMember({
      actorUserId: user.id,
      registrationId,
      userId: String(formData.get("userId") ?? ""),
      reason,
    });
    revalidatePath(`/admin/registrations/${registrationId}`);
    return { ok: true, message: "Đã gỡ thành viên khỏi đội." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteStaticPageAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("content:manage");
  try {
    const reason = confirm(formData);
    const result = await deleteStaticPage({
      actorUserId: user.id,
      id: String(formData.get("id") ?? ""),
      reason,
    });
    revalidatePath("/admin/content");
    revalidatePath("/");
    revalidatePath(`/${result.slug}`);
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/content");
}

export async function deleteFaqAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("content:manage");
  try {
    const reason = confirm(formData);
    await deleteFaq({
      actorUserId: user.id,
      id: String(formData.get("id") ?? ""),
      reason,
    });
    revalidatePath("/admin/faqs");
    revalidatePath("/faq");
    revalidatePath("/");
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/faqs");
}

export async function deleteAnnouncementAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("content:manage");
  try {
    const reason = confirm(formData);
    const result = await deleteAnnouncement({
      actorUserId: user.id,
      id: String(formData.get("id") ?? ""),
      reason,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/tin-tuc");
    revalidatePath("/");
    revalidatePath(`/tin-tuc/${result.slug}`);
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/announcements");
}
