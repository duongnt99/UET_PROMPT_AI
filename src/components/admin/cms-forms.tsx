"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import {
  saveAnnouncementAction,
  saveFaqAction,
  saveLandingOverviewAction,
  saveLandingFinalRoundsAction,
  saveStaticPageAction,
  saveTimelineItemAction,
  type ContentActionState,
} from "@/server/actions/content-actions";

const idle: ContentActionState = { ok: true, message: "" };

type LandingOverviewSettings = {
  competitionName: string;
  landingHeroTitle: string;
  landingHeroHighlight: string;
  shortDescription: string;
  fullDescription: string;
  landingAudienceText: string;
  landingToolsText: string;
};

export function LandingOverviewForm({ settings }: { settings: LandingOverviewSettings }) {
  const [state, action, pending] = useActionState(saveLandingOverviewAction, idle);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="competitionName">Tên cuộc thi trong hệ thống</Label>
        <Input id="competitionName" name="competitionName" required defaultValue={settings.competitionName} className="mt-1" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="landingHeroTitle">Tiêu đề chính</Label>
          <Input id="landingHeroTitle" name="landingHeroTitle" required defaultValue={settings.landingHeroTitle} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="landingHeroHighlight">Dòng tiêu đề màu xanh</Label>
          <Input id="landingHeroHighlight" name="landingHeroHighlight" required defaultValue={settings.landingHeroHighlight} className="mt-1" />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Hai dòng tiêu đề này cũng được ghép thành tên thương hiệu trên thanh điều hướng và chân trang.
      </p>
      <div>
        <Label htmlFor="shortDescription">Mô tả ngắn dưới tiêu đề</Label>
        <Textarea id="shortDescription" name="shortDescription" required defaultValue={settings.shortDescription} className="mt-1 min-h-24" />
      </div>
      <div>
        <Label htmlFor="fullDescription">Đoạn “Thông tin cuộc thi”</Label>
        <Textarea id="fullDescription" name="fullDescription" required defaultValue={settings.fullDescription} className="mt-1 min-h-44" />
        <p className="mt-1 text-xs text-slate-500">
          Nên viết 2–3 đoạn ngắn. Nhấn Enter hai lần để tách đoạn; trang chủ sẽ tự giữ khoảng cách và căn chữ dễ đọc.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="landingAudienceText">Đối tượng</Label>
          <Textarea id="landingAudienceText" name="landingAudienceText" required defaultValue={settings.landingAudienceText} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="landingToolsText">Công cụ</Label>
          <Textarea id="landingToolsText" name="landingToolsText" required defaultValue={settings.landingToolsText} className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="landing-overview-reason">Lý do thay đổi (tùy chọn)</Label>
        <Input id="landing-overview-reason" name="reason" placeholder="Ví dụ: cập nhật thông tin theo kế hoạch tổ chức" className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu nội dung giới thiệu"}</Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

const STATUS_OPTIONS = [
  ["DRAFT", "Nháp — chưa hiện công khai"],
  ["SCHEDULED", "Hẹn đăng — chưa hiện (đổi sang Đã đăng khi muốn hiện)"],
  ["PUBLISHED", "Đã đăng — hiện trên website"],
  ["ARCHIVED", "Lưu trữ — ẩn khỏi website"],
] as const;

function StatusSelect({ defaultValue, id = "status" }: { defaultValue?: string; id?: string }) {
  return (
    <div>
      <Label htmlFor={id}>Trạng thái</Label>
      <select
        id={id}
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

export function TimelineItemForm({
  item,
}: {
  item?: {
    id: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    statusLabel: string;
    displayOrder: number;
    status: string;
  };
}) {
  const [state, action, pending] = useActionState(saveTimelineItemAction, idle);
  const prefix = item?.id ?? "timeline-new";

  return (
    <form action={action} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div>
        <Label htmlFor={`${prefix}-title`}>Tiêu đề</Label>
        <Input
          id={`${prefix}-title`}
          name="title"
          required
          defaultValue={item?.title}
          placeholder="Ví dụ: Phát động và mở đăng ký"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-description`}>Mô tả</Label>
        <Textarea
          id={`${prefix}-description`}
          name="description"
          required
          defaultValue={item?.description}
          placeholder="Nội dung ngắn hiển thị trên thẻ lịch trình"
          className="mt-1 min-h-24"
        />
        <p className="mt-1 text-xs text-slate-500">
          Nhấn Enter một lần để xuống dòng; hai lần để tách thành đoạn mới. URL bắt đầu bằng http:// hoặc https://
          sẽ tự trở thành liên kết có thể bấm.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${prefix}-startAt`}>Bắt đầu</Label>
          <Input
            id={`${prefix}-startAt`}
            name="startAt"
            type="datetime-local"
            defaultValue={item?.startAt}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-endAt`}>Kết thúc</Label>
          <Input
            id={`${prefix}-endAt`}
            name="endAt"
            type="datetime-local"
            defaultValue={item?.endAt}
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`${prefix}-statusLabel`}>Nhãn trên thẻ</Label>
          <Input
            id={`${prefix}-statusLabel`}
            name="statusLabel"
            defaultValue={item?.statusLabel ?? "Dự kiến"}
            placeholder="Dự kiến hoặc mốc ngày"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-displayOrder`}>Thứ tự hiển thị</Label>
          <Input
            id={`${prefix}-displayOrder`}
            name="displayOrder"
            type="number"
            defaultValue={item?.displayOrder ?? 0}
            className="mt-1"
          />
        </div>
      </div>
      <StatusSelect id={`${prefix}-status`} defaultValue={item?.status} />
      <p className="text-xs text-slate-500">Chỉ mốc có trạng thái Đã đăng mới xuất hiện trên website.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : item ? "Lưu mốc lịch trình" : "Tạo mốc lịch trình"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

type FinalRoundSettings = {
  landingFinalRoundTitle: string;
  finalRoundSprintTitle: string;
  finalRoundSprintDescription: string;
  finalRoundPitchTitle: string;
  finalRoundPitchDescription: string;
  finalRoundVerdictTitle: string;
  finalRoundVerdictDescription: string;
  finalRoundTwistTitle: string;
  finalRoundTwistDescription: string;
};

const FINAL_ROUND_FIELDS = [
  ["Sprint", "The Sprint"],
  ["Pitch", "The Pitch"],
  ["Verdict", "The Verdict"],
  ["Twist", "On-stage Twist"],
] as const;

export function LandingFinalRoundsForm({ settings }: { settings: FinalRoundSettings }) {
  const [state, action, pending] = useActionState(saveLandingFinalRoundsAction, idle);

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="landing-final-round-title">Tiêu đề phần vòng chung kết</Label>
        <Input
          id="landing-final-round-title"
          name="landingFinalRoundTitle"
          required
          defaultValue={settings.landingFinalRoundTitle}
          className="mt-1"
        />
      </div>
      {FINAL_ROUND_FIELDS.map(([key, fallbackTitle]) => {
        const titleName = `finalRound${key}Title` as keyof FinalRoundSettings;
        const descriptionName = `finalRound${key}Description` as keyof FinalRoundSettings;
        const id = key.toLowerCase();
        return (
          <fieldset key={key} className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-900">{fallbackTitle}</legend>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`${id}-title`}>Tiêu đề</Label>
                <Input
                  id={`${id}-title`}
                  name={titleName}
                  required
                  defaultValue={settings[titleName]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${id}-description`}>Mô tả</Label>
                <Textarea
                  id={`${id}-description`}
                  name={descriptionName}
                  required
                  defaultValue={settings[descriptionName]}
                  className="mt-1 min-h-24"
                />
              </div>
            </div>
          </fieldset>
        );
      })}
      <p className="text-xs text-slate-500">
        Có thể dùng <code>{"{thoi_luong}"}</code> trong mô tả Sprint, Pitch hoặc Verdict; website sẽ tự thay bằng
        thời lượng đang cấu hình trong Cài đặt.
      </p>
      <div>
        <Label htmlFor="final-round-reason">Lý do thay đổi (tùy chọn)</Label>
        <Input
          id="final-round-reason"
          name="reason"
          placeholder="Ví dụ: cập nhật nội dung theo thể lệ mới"
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu nội dung vòng chung kết"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

function Feedback({ state, pending }: { state: ContentActionState; pending: boolean }) {
  const router = useRouter();
  const refreshedFor = useRef("");

  useEffect(() => {
    if (!state.ok || !state.message || pending) return;
    if (refreshedFor.current === state.message) return;
    refreshedFor.current = state.message;
    router.refresh();
  }, [state.ok, state.message, pending, router]);

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
        {page?.slug === "tieu-chi-cham" ? (
          <p className="mt-1 text-xs text-slate-500">
            Đoạn này hiện trên trang chủ (phần Tiêu chí chấm) và trang /tieu-chi-cham. Các thẻ trọng số
            (40/30/30…) lấy từ menu <strong>Bộ tiêu chí chấm</strong> đang kích hoạt, không lấy từ ô nội dung này.
          </p>
        ) : null}
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
        <p className="mt-1 text-xs text-slate-500">
          Nhấn Enter một lần để xuống dòng; hai lần để tách thành đoạn mới. URL bắt đầu bằng http:// hoặc https://
          sẽ tự trở thành liên kết có thể bấm.
        </p>
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
