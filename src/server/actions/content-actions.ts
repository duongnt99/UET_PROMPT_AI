"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import {
  parseContentStatus,
  saveAnnouncement,
  saveFaq,
  saveStaticPage,
} from "@/server/services/admin-content-service";

export type ContentActionState = { ok: boolean; message: string };

function fail(error: unknown): ContentActionState {
  return { ok: false, message: error instanceof Error ? error.message : "Không lưu được." };
}

function revalidateSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/faq");
  revalidatePath("/tin-tuc");
  revalidatePath("/admin/content");
  revalidatePath("/admin/faqs");
  revalidatePath("/admin/announcements");
  if (slug) {
    revalidatePath(`/${slug}`);
    revalidatePath(`/tin-tuc/${slug}`);
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
