"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { saveJudgeDraft, submitJudgeScore } from "@/server/services/match-service";

export type JudgeActionState = { ok: boolean; message: string };

export async function saveJudgeDraftAction(
  _prev: JudgeActionState,
  formData: FormData,
): Promise<JudgeActionState> {
  try {
    const user = await requirePermission("judge:score");
    const assignmentId = String(formData.get("assignmentId"));
    const competitorId = String(formData.get("competitorId"));
    const matchId = String(formData.get("matchId"));
    const items = [...formData.entries()]
      .filter(([key]) => key.startsWith("score-"))
      .map(([key, value]) => ({
        criterionId: key.slice("score-".length),
        rawScore: String(value ?? "0"),
      }));
    if (items.length === 0) {
      return { ok: false, message: "Chưa có điểm tiêu chí để lưu." };
    }
    await saveJudgeDraft({
      judgeId: user.id,
      assignmentId,
      competitorId,
      overallComment: String(formData.get("overallComment") ?? ""),
      items,
    });
    revalidatePath(`/judge/matches/${matchId}`);
    revalidatePath("/judge");
    return { ok: true, message: "Đã lưu nháp điểm cho thí sinh/đội này." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không lưu được nháp." };
  }
}

export async function submitJudgeScoreAction(
  _prev: JudgeActionState,
  formData: FormData,
): Promise<JudgeActionState> {
  try {
    const user = await requirePermission("judge:score");
    const assignmentId = String(formData.get("assignmentId"));
    const matchId = String(formData.get("matchId"));
    await submitJudgeScore({ judgeId: user.id, assignmentId });
    revalidatePath(`/judge/matches/${matchId}`);
    revalidatePath("/judge");
    revalidatePath("/admin/scoring");
    return { ok: true, message: "Đã ghi nhận phiếu chấm của bạn." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không nộp được điểm." };
  }
}
