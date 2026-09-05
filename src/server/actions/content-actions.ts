"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fromZonedTime } from "date-fns-tz";
import { requirePermission } from "@/lib/auth/guards";
import { APP_TIMEZONE } from "@/lib/dates";
import {
  parseContentStatus,
  saveAnnouncement,
  saveFaq,
  saveStaticPage,
  saveTimelineItem,
} from "@/server/services/admin-content-service";
import {
  getProductionCompetition,
  updateCompetitionSettings,
} from "@/server/services/competition-service";

export type ContentActionState = { ok: boolean; message: string };

function fail(error: unknown): ContentActionState {
  return { ok: false, message: error instanceof Error ? error.message : "Không lưu được." };
}

function requiredText(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`Cần ${label}.`);
  return value;
}

function optionalDate(formData: FormData, name: string, label: string) {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = fromZonedTime(raw, APP_TIMEZONE);
  if (Number.isNaN(value.getTime())) throw new Error(`${label} không hợp lệ.`);
  return value;
}

function revalidateSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/faq");
  revalidatePath("/lich-trinh");
  revalidatePath("/tin-tuc");
  revalidatePath("/admin/content");
  revalidatePath("/admin/faqs");
  revalidatePath("/admin/announcements");
  if (slug) {
    revalidatePath(`/${slug}`);
    revalidatePath(`/tin-tuc/${slug}`);
  }
}

export async function saveTimelineItemAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = await requirePermission("content:manage");
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    await saveTimelineItem({
      actorUserId: user.id,
      id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      startAt: optionalDate(formData, "startAt", "Thời điểm bắt đầu"),
      endAt: optionalDate(formData, "endAt", "Thời điểm kết thúc"),
      statusLabel: String(formData.get("statusLabel") ?? ""),
      displayOrder: Number(formData.get("displayOrder") ?? 0) || 0,
      status: parseContentStatus(String(formData.get("status") ?? "DRAFT")),
    });
    revalidateSite();
    return {
      ok: true,
      message: id
        ? "Đã lưu mốc lịch trình. Chỉ mục Đã đăng mới hiện trên website."
        : "Đã tạo mốc lịch trình. Chỉ mục Đã đăng mới hiện trên website.",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function saveLandingFinalRoundsAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = await requirePermission("content:manage");
  try {
    const competition = await getProductionCompetition();
    if (!competition) throw new Error("Chưa có cuộc thi production.");

    await updateCompetitionSettings({
      competitionId: competition.id,
      actorUserId: user.id,
      settings: {
        ...competition.settings,
        landingFinalRoundTitle: requiredText(
          formData,
          "landingFinalRoundTitle",
          "tiêu đề phần Vòng chung kết",
        ),
        finalRoundSprintTitle: requiredText(formData, "finalRoundSprintTitle", "tiêu đề The Sprint"),
        finalRoundSprintDescription: requiredText(
          formData,
          "finalRoundSprintDescription",
          "mô tả The Sprint",
        ),
        finalRoundPitchTitle: requiredText(formData, "finalRoundPitchTitle", "tiêu đề The Pitch"),
        finalRoundPitchDescription: requiredText(
          formData,
          "finalRoundPitchDescription",
          "mô tả The Pitch",
        ),
        finalRoundVerdictTitle: requiredText(formData, "finalRoundVerdictTitle", "tiêu đề The Verdict"),
        finalRoundVerdictDescription: requiredText(
          formData,
          "finalRoundVerdictDescription",
          "mô tả The Verdict",
        ),
        finalRoundTwistTitle: requiredText(formData, "finalRoundTwistTitle", "tiêu đề On-stage Twist"),
        finalRoundTwistDescription: requiredText(
          formData,
          "finalRoundTwistDescription",
          "mô tả On-stage Twist",
        ),
      },
      reason: String(formData.get("reason") ?? "").trim() || "Cập nhật nội dung vòng chung kết",
    });
    revalidateSite();
    revalidatePath("/admin/settings");
    return { ok: true, message: "Đã lưu nội dung vòng chung kết trên trang chủ." };
  } catch (error) {
    return fail(error);
  }
}

export async function saveStaticPageAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = await requirePermission("content:manage");
  let redirectTo: string | null = null;
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const page = await saveStaticPage({
      actorUserId: user.id,
      id,
      slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? ""),
      bodyMarkdown: String(formData.get("bodyMarkdown") ?? ""),
      status: parseContentStatus(String(formData.get("status") ?? "DRAFT")),
    });
    revalidateSite(page.slug);
    if (!id) redirectTo = `/admin/content/${page.id}`;
    else return { ok: true, message: `Đã lưu. Trang công khai: /${page.slug} (chỉ hiện khi Đã đăng).` };
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã lưu." };
}

export async function saveFaqAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = await requirePermission("content:manage");
  let redirectTo: string | null = null;
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const faq = await saveFaq({
      actorUserId: user.id,
      id,
      question: String(formData.get("question") ?? ""),
      answerMarkdown: String(formData.get("answerMarkdown") ?? ""),
      displayOrder: Number(formData.get("displayOrder") ?? 0) || 0,
      status: parseContentStatus(String(formData.get("status") ?? "DRAFT")),
    });
    revalidateSite();
    if (!id) redirectTo = `/admin/faqs/${faq.id}`;
    else return { ok: true, message: "Đã lưu FAQ. Chỉ mục Đã đăng mới hiện trên /faq và trang chủ." };
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã lưu." };
}

export async function saveAnnouncementAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const user = await requirePermission("content:manage");
  const publishRaw = String(formData.get("publishAt") ?? "").trim();
  const publishAt = publishRaw ? new Date(publishRaw) : null;
  if (publishRaw && Number.isNaN(publishAt?.getTime())) {
    return { ok: false, message: "Thời điểm đăng không hợp lệ." };
  }
  let redirectTo: string | null = null;
  try {
    const id = String(formData.get("id") ?? "").trim() || undefined;
    const item = await saveAnnouncement({
      actorUserId: user.id,
      id,
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      excerpt: String(formData.get("excerpt") ?? ""),
      bodyMarkdown: String(formData.get("bodyMarkdown") ?? ""),
      status: parseContentStatus(String(formData.get("status") ?? "DRAFT")),
      publishAt,
    });
    revalidateSite(item.slug);
    if (!id) redirectTo = `/admin/announcements/${item.id}`;
    else return { ok: true, message: `Đã lưu. Tin công khai: /tin-tuc/${item.slug} (chỉ hiện khi Đã đăng).` };
  } catch (error) {
    return fail(error);
  }
  if (redirectTo) redirect(redirectTo);
  return { ok: true, message: "Đã lưu." };
}
