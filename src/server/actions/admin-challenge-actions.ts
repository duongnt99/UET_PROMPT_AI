"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { deleteMatchChallenge, saveMatchChallenge } from "@/server/services/match-challenge-service";
import type { AdminDeleteState } from "@/server/actions/admin-delete-actions";
import { assertDeleteConfirmation } from "@/server/domain/admin-delete";

export type ChallengeActionState = { ok: boolean; message: string };

function fail(error: unknown): ChallengeActionState {
  return { ok: false, message: error instanceof Error ? error.message : "Không lưu được đề thi." };
}

function revalidateChallenges() {
  revalidatePath("/admin/challenges");
  revalidatePath("/admin/bracket");
  revalidatePath("/stage/current-match");
  revalidatePath("/stage/problem");
  revalidatePath("/overlay/current-match");
  revalidatePath("/dashboard/thi-truc-tiep");
}

export async function saveChallengeAction(
  _prev: ChallengeActionState,
  formData: FormData,
): Promise<ChallengeActionState> {
  const user = await requirePermission("bracket:manage");
  let redirectTo: string | null = null;
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const challenge = await saveMatchChallenge({
      actorUserId: user.id,
      id,
      title: String(formData.get("title") ?? ""),
      prompt: String(formData.get("prompt") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    revalidateChallenges();
    if (!id) redirectTo = `/admin/challenges/${challenge.id}`;
    else return { ok: true, message: "Đã lưu đề thi." };
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã lưu đề thi." };
}

export async function deleteChallengeAction(
  _prev: AdminDeleteState,
  formData: FormData,
): Promise<AdminDeleteState> {
  const user = await requirePermission("bracket:manage");
  try {
    const reason = assertDeleteConfirmation({
      confirm: String(formData.get("confirm") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    await deleteMatchChallenge({
      actorUserId: user.id,
      id: String(formData.get("id") ?? ""),
      reason,
    });
    revalidateChallenges();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không xóa được đề thi." };
  }
  redirect("/admin/challenges");
}
