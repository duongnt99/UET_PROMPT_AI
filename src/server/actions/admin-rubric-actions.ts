"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { assertDeleteConfirmation } from "@/server/domain/admin-delete";
import { parseRubricCriteriaJson } from "@/server/domain/rubric";
import {
  activateRubric,
  cloneRubric,
  deleteRubric,
  saveRubric,
} from "@/server/services/rubric-service";

export type RubricActionState = { ok: boolean; message: string };

function fail(error: unknown): RubricActionState {
  return { ok: false, message: error instanceof Error ? error.message : "Không lưu được." };
}

function refreshRubric() {
  revalidatePath("/admin/rubrics");
  revalidatePath("/tieu-chi-cham");
  revalidatePath("/");
  revalidatePath("/reviewer");
  revalidatePath("/judge");
}

export async function saveRubricAction(
  _prev: RubricActionState,
  formData: FormData,
): Promise<RubricActionState> {
  const user = await requirePermission("settings:write");
  let redirectTo: string | null = null;
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const rubric = await saveRubric({
      actorUserId: user.id,
      id,
      competitionId: String(formData.get("competitionId") ?? ""),
      stage: String(formData.get("stage") ?? ""),
      name: String(formData.get("name") ?? ""),
      criteria: parseRubricCriteriaJson(String(formData.get("criteriaJson") ?? "[]")),
    });
    refreshRubric();
    if (!id) redirectTo = `/admin/rubrics/${rubric.id}`;
    else return { ok: true, message: "Đã lưu rubric. Kích hoạt nếu muốn dùng cho lần chấm tiếp theo." };
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã lưu." };
}

export async function cloneRubricAction(
  _prev: RubricActionState,
  formData: FormData,
): Promise<RubricActionState> {
  const user = await requirePermission("settings:write");
  let redirectTo: string | null = null;
  try {
    const cloned = await cloneRubric({
      actorUserId: user.id,
      rubricId: String(formData.get("rubricId") ?? ""),
    });
    refreshRubric();
    redirectTo = `/admin/rubrics/${cloned.id}`;
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã tạo phiên bản mới." };
}

export async function activateRubricAction(
  _prev: RubricActionState,
  formData: FormData,
): Promise<RubricActionState> {
  const user = await requirePermission("settings:write");
  try {
    await activateRubric({
      actorUserId: user.id,
      rubricId: String(formData.get("rubricId") ?? ""),
    });
    refreshRubric();
    return { ok: true, message: "Đã kích hoạt. Phiếu chấm mới sẽ dùng phiên bản này." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteRubricAction(
  _prev: RubricActionState,
  formData: FormData,
): Promise<RubricActionState> {
  const user = await requirePermission("settings:write");
  try {
    const reason = assertDeleteConfirmation({
      confirm: String(formData.get("confirm") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    await deleteRubric({
      actorUserId: user.id,
      rubricId: String(formData.get("id") ?? ""),
      reason,
    });
    refreshRubric();
  } catch (error) {
    return fail(error);
  }
  redirect("/admin/rubrics");
}
