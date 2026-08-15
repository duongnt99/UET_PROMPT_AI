"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import {
  saveAnnouncementAction,
  saveFaqAction,
  saveStaticPageAction,
  type ContentActionState,
} from "@/server/actions/content-actions";

const idle: ContentActionState = { ok: true, message: "" };

const STATUS_OPTIONS = [
  ["DRAFT", "Nháp — chưa hiện công khai"],
  ["SCHEDULED", "Hẹn đăng — chưa hiện (đổi sang Đã đăng khi muốn hiện)"],
  ["PUBLISHED", "Đã đăng — hiện trên website"],
  ["ARCHIVED", "Lưu trữ — ẩn khỏi website"],
] as const;

function StatusSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor="status">Trạng thái</Label>
      <select
        id="status"
        name="status"
        defaultValue={defaultValue ?? "DRAFT"}
        className="mt-1 h-11 w-full rounded-xl border px-3"
      >
        {STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Feedback({ state, pending }: { state: ContentActionState; pending: boolean }) {
  if (pending) return <p className="text-sm text-slate-600">Đang lưu…</p>;
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

export function StaticPageForm({
  page,
}: {
  page?: { id: string; slug: string; title: string; bodyMarkdown: string; status: string };
}) {
  const [state, action, pending] = useActionState(saveStaticPageAction, idle);
  return (
    <form action={action} className="space-y-4">
      {page ? <input type="hidden" name="id" value={page.id} /> : null}
      <div>
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" name="title" required defaultValue={page?.title} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="slug">Đường dẫn (slug)</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={page?.slug}
          placeholder="vi-du: the-le — để trống sẽ lấy từ tiêu đề"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-slate-500">
          Trang có sẵn: /gioi-thieu, /the-le, /huong-dan-audition, /tieu-chi-cham, /lien-he, /chinh-sach-bao-mat,
          /dieu-khoan. Đổi slug sẽ đổi URL công khai.
        </p>
      </div>
      <StatusSelect defaultValue={page?.status} />
      <div>
        <Label htmlFor="bodyMarkdown">Nội dung</Label>
        <Textarea
          id="bodyMarkdown"
          name="bodyMarkdown"
          required
          defaultValue={page?.bodyMarkdown}
          className="mt-1 min-h-72"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : page ? "Lưu trang" : "Tạo trang"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function FaqForm({
  faq,
}: {
  faq?: { id: string; question: string; answerMarkdown: string; displayOrder: number; status: string };
}) {
  const [state, action, pending] = useActionState(saveFaqAction, idle);
  return (
    <form action={action} className="space-y-4">
      {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
      <div>
        <Label htmlFor="question">Câu hỏi</Label>
        <Input id="question" name="question" required defaultValue={faq?.question} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="answerMarkdown">Câu trả lời</Label>
        <Textarea
          id="answerMarkdown"
          name="answerMarkdown"
          required
          defaultValue={faq?.answerMarkdown}
          className="mt-1 min-h-40"
        />
      </div>
      <div>
        <Label htmlFor="displayOrder">Thứ tự hiển thị</Label>
        <Input
          id="displayOrder"
          name="displayOrder"
          type="number"
          defaultValue={faq?.displayOrder ?? 0}
          className="mt-1"
        />
      </div>
      <StatusSelect defaultValue={faq?.status} />
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : faq ? "Lưu FAQ" : "Tạo FAQ"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function AnnouncementForm({
  item,
}: {
  item?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    bodyMarkdown: string;
    status: string;
    publishAt: string;
  };
}) {
  const [state, action, pending] = useActionState(saveAnnouncementAction, idle);
  return (
    <form action={action} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div>
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" name="title" required defaultValue={item?.title} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="slug">Đường dẫn (slug)</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={item?.slug}
          placeholder="tu-dong-tu-tieu-de-neu-de-trong"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-slate-500">Tin hiện tại /tin-tuc/[slug]</p>
      </div>
      <div>
        <Label htmlFor="excerpt">Tóm tắt (hiện trên danh sách tin)</Label>
        <Textarea id="excerpt" name="excerpt" defaultValue={item?.excerpt} className="mt-1 min-h-20" />
      </div>
      <div>
        <Label htmlFor="publishAt">Thời điểm đăng (tùy chọn)</Label>
        <Input id="publishAt" name="publishAt" type="datetime-local" defaultValue={item?.publishAt} className="mt-1" />
      </div>
      <StatusSelect defaultValue={item?.status} />
      <div>
        <Label htmlFor="bodyMarkdown">Nội dung</Label>
        <Textarea
          id="bodyMarkdown"
          name="bodyMarkdown"
          required
          defaultValue={item?.bodyMarkdown}
          className="mt-1 min-h-72"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : item ? "Lưu tin" : "Tạo tin"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}
