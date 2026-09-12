"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { formatDurationLabel, formatTimerClock } from "@/server/domain/match-setup";
import type { CompetitionSettings } from "@/config/competition-settings";

export function CompetitionSettingsForm({ settings }: { settings: CompetitionSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveSettingsAction(formData);
      if (!result.ok) {
        toast.error(result.message ?? "Không lưu được cài đặt.");
        return;
      }
      toast.success(result.message ?? "Đã lưu cài đặt cuộc thi.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-4">
      <div>
        <Label htmlFor="competitionName">Tên cuộc thi</Label>
        <Input id="competitionName" name="competitionName" defaultValue={settings.competitionName} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="shortDescription">Mô tả ngắn</Label>
        <Textarea id="shortDescription" name="shortDescription" defaultValue={settings.shortDescription} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="venue">Địa điểm</Label>
        <Input id="venue" name="venue" defaultValue={settings.venue} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="officialContactEmail">Email liên hệ</Label>
        <Input
          id="officialContactEmail"
          name="officialContactEmail"
          defaultValue={settings.officialContactEmail}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="registrationMode">Hình thức đăng ký</Label>
        <select name="registrationMode" defaultValue={settings.registrationMode} className="mt-1 h-11 w-full rounded-xl border px-3">
          <option value="UNDECIDED">Chưa chốt</option>
          <option value="INDIVIDUAL">Cá nhân</option>
          <option value="TEAM">Đội</option>
          <option value="BOTH">Cả hai</option>
        </select>
      </div>
      <div>
        <Label htmlFor="livestreamUrl">Đường dẫn phát trực tiếp</Label>
        <Input id="livestreamUrl" name="livestreamUrl" defaultValue={settings.livestreamUrl} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="prizeInformation">Giải thưởng (để trống = Đang cập nhật)</Label>
        <Textarea id="prizeInformation" name="prizeInformation" defaultValue={settings.prizeInformation} className="mt-1" />
      </div>
      <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-800">Audition — mặc định toàn cuộc thi</legend>
        <div>
          <Label htmlFor="reviewSubmissionLimit">Số lượt nộp đánh giá mặc định / reviewer</Label>
          <Input
            id="reviewSubmissionLimit"
            name="reviewSubmissionLimit"
            type="number"
            min={1}
            defaultValue={settings.reviewSubmissionLimit}
            className="mt-1 max-w-xs"
          />
          <p className="mt-1 text-xs text-slate-500">
            Mặc định khi bài chưa có cài đặt riêng. Chỉnh từng bài tại Admin → Bài dự thi → chi tiết bài.
          </p>
        </div>
      </fieldset>
      <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-800">Chung kết và đồng hồ</legend>
        <div>
          <Label htmlFor="finalistCount">Số đội chung kết</Label>
          <Input
            id="finalistCount"
            name="finalistCount"
            type="number"
            min={2}
            defaultValue={settings.finalistCount}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-slate-500">Mặc định 8 đội, loại trực tiếp 8 → 4 → 2.</p>
        </div>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="allowByes" defaultChecked={settings.allowByes} />
          Cho phép bye (miễn đấu). Để trống = không bye.
        </label>
        <div>
          <Label htmlFor="sprintDurationSeconds">Phần thi thực hành (giây)</Label>
          <Input
            id="sprintDurationSeconds"
            name="sprintDurationSeconds"
            type="number"
            min={1}
            list="sprint-presets"
            defaultValue={settings.sprintDurationSeconds}
            className="mt-1"
          />
          <datalist id="sprint-presets">
            <option value="300" label="5 phút" />
            <option value="600" label="10 phút" />
            <option value="420" label="7 phút" />
          </datalist>
          <p className="mt-1 text-xs text-slate-500">
            Hiện tại {formatTimerClock(settings.sprintDurationSeconds)} ({formatDurationLabel(settings.sprintDurationSeconds)}).
            Mặc định 300 (5 phút); thử 10 phút thì điền 600. Đồng hồ chưa chạy sẽ được cập nhật sau khi lưu.
          </p>
        </div>
        <div>
          <Label htmlFor="pitchDurationSeconds">Phần thuyết trình (giây)</Label>
          <Input
            id="pitchDurationSeconds"
            name="pitchDurationSeconds"
            type="number"
            min={1}
            defaultValue={settings.pitchDurationSeconds}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-slate-500">
            Hiện tại {formatTimerClock(settings.pitchDurationSeconds)}. Mặc định 60 giây.
          </p>
        </div>
        <div>
          <Label htmlFor="verdictDurationSeconds">Phần quyết định kết quả (giây)</Label>
          <Input
            id="verdictDurationSeconds"
            name="verdictDurationSeconds"
            type="number"
            min={1}
            defaultValue={settings.verdictDurationSeconds}
            className="mt-1"
          />
        </div>
      </fieldset>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="registrationEnabled" defaultChecked={settings.registrationEnabled} /> Mở đăng ký
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="submissionEnabled" defaultChecked={settings.submissionEnabled} /> Mở nộp bài
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="publicScoreboardEnabled" defaultChecked={settings.publicScoreboardEnabled} /> Công khai
        bảng đấu trực tiếp
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="livestreamEnabled" defaultChecked={settings.livestreamEnabled} /> Bật phát trực tiếp
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenanceMode} /> Bảo trì
      </label>
      <div>
        <Label htmlFor="reason">Lý do thay đổi (ghi vào nhật ký)</Label>
        <Input id="reason" name="reason" className="mt-1" placeholder="Ví dụ: Điều chỉnh thời lượng phần thi thực hành" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Đang lưu..." : "Lưu cài đặt"}</Button>
    </form>
  );
}
