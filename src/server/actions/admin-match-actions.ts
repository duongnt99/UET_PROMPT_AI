"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";
import { matchStatusLabel } from "@/lib/status-labels";
import {
  assignMatchJudges,
  createAndOpenScoringMatch,
  setCurrentMatch,
  setMatchStatus,
  setMatchPublicStatus,
  stopMatch,
  updateMatchPairing,
  advanceWinner,
  controlTimer,
  createEightTeamBracket,
} from "@/server/services/match-service";
import {
  assignChallengeToMatch,
  clearMatchProblem,
  saveMatchProblem,
} from "@/server/services/match-challenge-service";

export type MatchSetupState = { ok: boolean; message: string };

function fail(error: unknown): MatchSetupState {
  return { ok: false, message: error instanceof Error ? error.message : "Không thực hiện được." };
}

export async function createEightTeamBracketAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const competition = await getProductionCompetition();
  if (!competition) return { ok: false, message: "Chưa có cuộc thi chính thức." };
  try {
    const result = await createEightTeamBracket({
      actorUserId: user.id,
      competitionId: competition.id,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/bracket");
    revalidatePath("/scoreboard");
    return { ok: true, message: `Đã tạo bảng đấu loại trực tiếp gồm ${result.matchCount} trận.` };
  } catch (error) {
    return fail(error);
  }
}

function revalidateMatch(matchId: string) {
  revalidatePath("/admin/bracket");
  revalidatePath(`/admin/bracket/${matchId}`);
  revalidatePath("/admin/scoring");
  revalidatePath("/admin/operations");
  revalidatePath("/admin/challenges");
  revalidatePath("/judge");
  revalidatePath(`/judge/matches/${matchId}`);
  revalidatePath("/stage/current-match");
  revalidatePath("/stage/problem");
  revalidatePath("/overlay/current-match");
  revalidatePath("/dashboard/thi-truc-tiep");
  revalidatePath("/scoreboard");
  revalidatePath(`/scoreboard/matches/${matchId}`);
}

export async function createScoringMatchAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  let redirectTo: string | null = null;
  try {
    const match = await createAndOpenScoringMatch({
      actorUserId: user.id,
      competitorAId: String(formData.get("competitorAId") ?? ""),
      competitorBId: String(formData.get("competitorBId") ?? ""),
      judgeIds: formData.getAll("judgeIds").map((item) => String(item)),
      roundId: String(formData.get("roundId") ?? "").trim() || undefined,
      code: String(formData.get("code") ?? "").trim() || undefined,
      setAsCurrent: formData.get("setAsCurrent") === "on",
      reason: String(formData.get("reason") ?? ""),
      problemTitle: String(formData.get("problemTitle") ?? ""),
      problemPrompt: String(formData.get("problemPrompt") ?? ""),
      challengeId: String(formData.get("challengeId") ?? "").trim() || undefined,
    });
    revalidateMatch(match.id);
    redirectTo = `/admin/bracket/${match.id}`;
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã tạo trận." };
}

export async function updateMatchPairingAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await updateMatchPairing({
      actorUserId: user.id,
      matchId,
      competitorAId: String(formData.get("competitorAId") ?? ""),
      competitorBId: String(formData.get("competitorBId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: `Đã đổi cặp: ${result.competitorA} vs ${result.competitorB}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function stopMatchAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await stopMatch({
      actorUserId: user.id,
      matchId,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: `Đã hủy trận ${result.code}. Đồng hồ đã tạm dừng.` };
  } catch (error) {
    return fail(error);
  }
}

export async function publishMatchAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await setMatchPublicStatus({
      actorUserId: user.id,
      matchId,
      publicStatus: "PUBLISHED",
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return {
      ok: true,
      message: `Đã công bố trận ${result.code} trên Bảng đấu. Điểm số hiển thị khi bật công khai điểm toàn cục.`,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function unpublishMatchAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await setMatchPublicStatus({
      actorUserId: user.id,
      matchId,
      publicStatus: "DRAFT",
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return {
      ok: true,
      message: `Đã ẩn trận ${result.code} khỏi công bố điểm trên Bảng đấu.`,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function setMatchStatusAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await setMatchStatus({
      actorUserId: user.id,
      matchId,
      status: String(formData.get("status") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: `Trận ${result.code} → ${matchStatusLabel(result.status)}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function setCurrentMatchAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("stage:control");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await setCurrentMatch({
      actorUserId: user.id,
      matchId,
      reason: String(formData.get("reason") ?? "Đặt trận hiện tại"),
    });
    revalidateMatch(matchId);
    return { ok: true, message: `Đã đặt ${result.code} làm trận hiện tại trên sân khấu/overlay.` };
  } catch (error) {
    return fail(error);
  }
}

export async function assignMatchJudgesAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("judge:assign");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    const result = await assignMatchJudges({
      actorUserId: user.id,
      matchId,
      judgeIds: formData.getAll("judgeIds").map((item) => String(item)),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: `Đã gán ${result.judgeCount} giám khảo cho trận ${result.code}.` };
  } catch (error) {
    return fail(error);
  }
}

export async function advanceMatchWinnerAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    await advanceWinner({
      actorUserId: user.id,
      matchId,
      winnerId: String(formData.get("winnerId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      expectedVersion: Number(formData.get("version") ?? 1),
    });
    revalidateMatch(matchId);
    return { ok: true, message: "Đã công bố đội thắng và kết thúc trận." };
  } catch (error) {
    return fail(error);
  }
}

export async function matchTimerAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("stage:control");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    await controlTimer({
      actorUserId: user.id,
      matchId,
      kind: String(formData.get("kind")) as "SPRINT" | "PITCH" | "VERDICT",
      action: String(formData.get("action")) as "start" | "pause" | "resume",
    });
    revalidateMatch(matchId);
    return { ok: true, message: "Đã cập nhật đồng hồ." };
  } catch (error) {
    return fail(error);
  }
}

export async function saveMatchProblemAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    await saveMatchProblem({
      actorUserId: user.id,
      matchId,
      title: String(formData.get("problemTitle") ?? ""),
      prompt: String(formData.get("problemPrompt") ?? ""),
      saveToLibrary: formData.get("saveToLibrary") === "on",
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: "Đã lưu đề thi cho cặp đấu." };
  } catch (error) {
    return fail(error);
  }
}

export async function assignChallengeToMatchAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    await assignChallengeToMatch({
      actorUserId: user.id,
      matchId,
      challengeId: String(formData.get("challengeId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: "Đã gán đề từ kho vào trận." };
  } catch (error) {
    return fail(error);
  }
}

export async function clearMatchProblemAction(
  _prev: MatchSetupState,
  formData: FormData,
): Promise<MatchSetupState> {
  const user = await requirePermission("bracket:manage");
  const matchId = String(formData.get("matchId") ?? "");
  try {
    await clearMatchProblem({
      actorUserId: user.id,
      matchId,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateMatch(matchId);
    return { ok: true, message: "Đã xóa đề thi khỏi cặp đấu." };
  } catch (error) {
    return fail(error);
  }
}
