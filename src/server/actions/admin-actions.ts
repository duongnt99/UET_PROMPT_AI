"use server";

import { requirePermission } from "@/lib/auth/guards";
import { getProductionCompetition, updateCompetitionSettings } from "@/server/services/competition-service";
import { competitionSettingsSchema } from "@/config/competition-settings";
import { autoAssignReviewers } from "@/server/services/review-service";
import { lockSelection, publishFinalists, setFinalistPublished, unselectFinalist } from "@/server/services/finalist-service";
import { toCsvWithBom } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import { controlTimer, advanceWinner } from "@/server/services/match-service";
import { revalidatePath } from "next/cache";

export async function saveSettingsAction(formData: FormData) {
  const user = await requirePermission("settings:write");
  const competition = await getProductionCompetition();
  if (!competition) return { ok: false, message: "Missing competition" };
  const next = {
    ...competition.settings,
    competitionName: String(formData.get("competitionName") ?? competition.settings.competitionName),
    shortDescription: String(formData.get("shortDescription") ?? competition.settings.shortDescription),
    venue: String(formData.get("venue") ?? competition.settings.venue),
    officialContactEmail: String(formData.get("officialContactEmail") ?? competition.settings.officialContactEmail),
    registrationMode: competitionSettingsSchema.shape.registrationMode.parse(
      formData.get("registrationMode") ?? competition.settings.registrationMode,
    ),
    livestreamUrl: String(formData.get("livestreamUrl") ?? ""),
    prizeInformation: String(formData.get("prizeInformation") ?? ""),
    maintenanceMode: formData.get("maintenanceMode") === "on",
    registrationEnabled: formData.get("registrationEnabled") === "on",
    submissionEnabled: formData.get("submissionEnabled") === "on",
    publicScoreboardEnabled: formData.get("publicScoreboardEnabled") === "on",
    livestreamEnabled: formData.get("livestreamEnabled") === "on",
    finalistCount: competitionSettingsSchema.shape.finalistCount.parse(
      Number(formData.get("finalistCount") ?? competition.settings.finalistCount),
    ),
    allowByes: formData.get("allowByes") === "on",
    sprintDurationSeconds: competitionSettingsSchema.shape.sprintDurationSeconds.parse(
      Number(formData.get("sprintDurationSeconds") ?? competition.settings.sprintDurationSeconds),
    ),
    pitchDurationSeconds: competitionSettingsSchema.shape.pitchDurationSeconds.parse(
      Number(formData.get("pitchDurationSeconds") ?? competition.settings.pitchDurationSeconds),
    ),
    verdictDurationSeconds: competitionSettingsSchema.shape.verdictDurationSeconds.parse(
      Number(formData.get("verdictDurationSeconds") ?? competition.settings.verdictDurationSeconds),
    ),
  };
  await updateCompetitionSettings({
    competitionId: competition.id,
    actorUserId: user.id,
    settings: next,
    reason: String(formData.get("reason") ?? "Admin updated settings"),
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/the-le");
  revalidatePath("/faq");
  return { ok: true };
}

export async function autoAssignAction() {
  const user = await requirePermission("review:assign");
  const competition = await getProductionCompetition();
  if (!competition) return;
  await autoAssignReviewers({
    actorUserId: user.id,
    competitionId: competition.id,
    reviewersPerSubmission: competition.settings.numberOfReviewersPerSubmission,
  });
  revalidatePath("/admin/review-assignments");
  revalidatePath("/reviewer");
}

export async function lockFinalistsAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  void _prev;
  const user = await requirePermission("finalist:manage");
  const competition = await getProductionCompetition();
  if (!competition) return { ok: false, message: "Chưa có cuộc thi production." };
  const fromList = formData.getAll("registrationIds").map((item) => String(item).trim());
  const fromCsv = String(formData.get("registrationIdsCsv") ?? "")
    .split(",")
    .map((item) => item.trim());
  const ids = [...new Set([...fromList, ...fromCsv].filter(Boolean))];
  try {
    await lockSelection({
      actorUserId: user.id,
      competitionId: competition.id,
      registrationIds: ids,
      overrideReason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/finalists");
    revalidatePath("/admin/bracket");
    revalidatePath("/finalists");
    return { ok: true, message: `Đã chọn ${ids.length} hồ sơ vào chung kết (chưa công bố công khai).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không khóa được danh sách." };
  }
}

export async function publishFinalistsAction(
  prev: { ok: boolean; message: string } = { ok: true, message: "" },
  formData?: FormData,
): Promise<{ ok: boolean; message: string }> {
  void prev;
  void formData;
  const user = await requirePermission("finalist:manage");
  const competition = await getProductionCompetition();
  if (!competition) return { ok: false, message: "Chưa có cuộc thi production." };
  try {
    await publishFinalists({ actorUserId: user.id, competitionId: competition.id });
    revalidatePath("/admin/finalists");
    revalidatePath("/finalists");
    revalidatePath("/dashboard/thong-bao");
    return { ok: true, message: "Đã công bố finalist đang SELECTED và gửi thông báo trong hệ thống." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không công bố được." };
  }
}

export async function unselectFinalistAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await requirePermission("finalist:manage");
  try {
    await unselectFinalist({
      actorUserId: user.id,
      finalistId: String(formData.get("finalistId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/finalists");
    revalidatePath("/admin/bracket");
    revalidatePath("/finalists");
    return { ok: true, message: "Đã bỏ khỏi danh sách finalist (hồ sơ = NOT_SELECTED, ẩn công khai)." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không bỏ được finalist." };
  }
}

export async function setFinalistPublishedAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await requirePermission("finalist:manage");
  try {
    const published = String(formData.get("published") ?? "") === "true";
    await setFinalistPublished({
      actorUserId: user.id,
      finalistId: String(formData.get("finalistId") ?? ""),
      published,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/finalists");
    revalidatePath("/finalists");
    return { ok: true, message: published ? "Đã hiện trên trang công khai." : "Đã ẩn khỏi trang công khai." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không đổi được công bố." };
  }
}

export async function exportRegistrationsCsv() {
  const user = await requirePermission("export:pii");
  const rows = await prisma.registration.findMany({
    include: { owner: { include: { profile: true } }, team: true },
    take: 5000,
  });
  await writeAuditLog({
    actorUserId: user.id,
    action: "export.registrations",
    entityType: "Registration",
  });
  return toCsvWithBom(
    ["code", "status", "type", "email", "fullName", "institution", "team"],
    rows.map((row) => [
      row.code,
      row.status,
      row.type,
      row.owner.email,
      row.owner.profile?.fullName ?? "",
      row.owner.profile?.institution ?? "",
      row.team?.teamName ?? "",
    ]),
  );
}

export async function timerAction(formData: FormData) {
  const user = await requirePermission("stage:control");
  await controlTimer({
    actorUserId: user.id,
    matchId: String(formData.get("matchId")),
    kind: String(formData.get("kind")) as "SPRINT" | "PITCH" | "VERDICT",
    action: String(formData.get("action")) as "start" | "pause" | "resume",
  });
}

export async function advanceWinnerAction(formData: FormData) {
  const user = await requirePermission("bracket:manage");
  await advanceWinner({
    actorUserId: user.id,
    matchId: String(formData.get("matchId")),
    winnerId: String(formData.get("winnerId")),
    reason: String(formData.get("reason") ?? "manual advancement"),
    expectedVersion: Number(formData.get("version") ?? 1),
  });
}

export async function setPublicScoresEnabledAction(
  enabled: boolean,
): Promise<{ ok: boolean; message: string }> {
  try {
    const user = await requirePermission("bracket:manage");
    const competition = await getProductionCompetition();
    if (!competition) {
      return { ok: false, message: "Không tìm thấy cuộc thi production." };
    }
    await updateCompetitionSettings({
      competitionId: competition.id,
      actorUserId: user.id,
      settings: {
        ...competition.settings,
        publicScoresEnabled: enabled,
      },
      reason: enabled ? "PUBLIC_SCORES_ENABLED" : "PUBLIC_SCORES_DISABLED",
    });
    await writeAuditLog({
      actorUserId: user.id,
      competitionId: competition.id,
      action: enabled ? "PUBLIC_SCORES_ENABLED" : "PUBLIC_SCORES_DISABLED",
      entityType: "Competition",
      entityId: competition.id,
      after: { publicScoresEnabled: enabled },
    });
    revalidatePath("/scoreboard");
    revalidatePath("/admin/bracket");
    revalidatePath("/admin/settings");
    return {
      ok: true,
      message: enabled
        ? "Đã công khai điểm trên Bảng đấu."
        : "Đã ẩn điểm khỏi Bảng đấu.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái công khai điểm. Vui lòng thử lại.",
    };
  }
}
