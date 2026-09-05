import { getProductionCompetition } from "@/server/services/competition-service";
import { saveSettingsAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";
import { formatDurationLabel, formatTimerClock } from "@/server/domain/match-setup";

async function save(formData: FormData) {
  "use server";
  await saveSettingsAction(formData);
}

export default async function Page() {
  await requirePermission("settings:read");
  const competition = await getProductionCompetition();
  const s = competition?.settings;
  return (
    <div>
      <h1 className="display text-3xl">Cài đặt cuộc thi</h1>
      <form action={save} className="mt-6 grid max-w-3xl gap-4">
        <div>
          <Label htmlFor="competitionName">Tên cuộc thi</Label>
          <Input id="competitionName" name="competitionName" defaultValue={s?.competitionName} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="shortDescription">Mô tả ngắn</Label>
          <Textarea id="shortDescription" name="shortDescription" defaultValue={s?.shortDescription} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="venue">Địa điểm</Label>
          <Input id="venue" name="venue" defaultValue={s?.venue} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="officialContactEmail">Email liên hệ</Label>
          <Input id="officialContactEmail" name="officialContactEmail" defaultValue={s?.officialContactEmail} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="registrationMode">Hình thức đăng ký</Label>
          <select name="registrationMode" defaultValue={s?.registrationMode} className="mt-1 h-11 w-full rounded-xl border px-3">
            <option value="UNDECIDED">Chưa chốt</option>
            <option value="INDIVIDUAL">Cá nhân</option>
            <option value="TEAM">Đội</option>
            <option value="BOTH">Cả hai</option>
          </select>
        </div>
        <div>
          <Label htmlFor="livestreamUrl">Livestream URL</Label>
          <Input id="livestreamUrl" name="livestreamUrl" defaultValue={s?.livestreamUrl} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="prizeInformation">Giải thưởng (để trống = Đang cập nhật)</Label>
          <Textarea id="prizeInformation" name="prizeInformation" defaultValue={s?.prizeInformation} className="mt-1" />
        </div>
        <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">Chung kết và đồng hồ</legend>
          <div>
            <Label htmlFor="finalistCount">Số đội chung kết</Label>
            <Input
              id="finalistCount"
              name="finalistCount"
              type="number"
              min={2}
              defaultValue={s?.finalistCount ?? 8}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">Mặc định 8 đội, loại trực tiếp 8 → 4 → 2.</p>
          </div>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="allowByes" defaultChecked={s?.allowByes} />
            Cho phép bye (miễn đấu). Để trống = không bye.
          </label>
          <div>
            <Label htmlFor="sprintDurationSeconds">The Sprint (giây)</Label>
            <Input
              id="sprintDurationSeconds"
              name="sprintDurationSeconds"
              type="number"
              min={1}
              list="sprint-presets"
              defaultValue={s?.sprintDurationSeconds ?? 300}
              className="mt-1"
            />
            <datalist id="sprint-presets">
              <option value="300" label="5 phút" />
              <option value="600" label="10 phút" />
              <option value="420" label="7 phút" />
            </datalist>
            <p className="mt-1 text-xs text-slate-500">
              Hiện tại {formatTimerClock(s?.sprintDurationSeconds ?? 300)} ({formatDurationLabel(s?.sprintDurationSeconds ?? 300)}).
              Mặc định 300 (5 phút); thử 10 phút thì điền 600. Trận đã tạo giữ timer cũ.
            </p>
          </div>
          <div>
            <Label htmlFor="pitchDurationSeconds">The Pitch (giây)</Label>
            <Input
              id="pitchDurationSeconds"
              name="pitchDurationSeconds"
              type="number"
              min={1}
              defaultValue={s?.pitchDurationSeconds ?? 60}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              Hiện tại {formatTimerClock(s?.pitchDurationSeconds ?? 60)}. Mặc định 60 giây.
            </p>
          </div>
          <div>
            <Label htmlFor="verdictDurationSeconds">The Verdict (giây)</Label>
            <Input
              id="verdictDurationSeconds"
              name="verdictDurationSeconds"
              type="number"
              min={1}
              defaultValue={s?.verdictDurationSeconds ?? 180}
              className="mt-1"
            />
          </div>
        </fieldset>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="registrationEnabled" defaultChecked={s?.registrationEnabled} /> Mở đăng ký</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="submissionEnabled" defaultChecked={s?.submissionEnabled} /> Mở nộp bài</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="publicScoreboardEnabled" defaultChecked={s?.publicScoreboardEnabled} /> Scoreboard công khai</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="livestreamEnabled" defaultChecked={s?.livestreamEnabled} /> Bật livestream</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="maintenanceMode" defaultChecked={s?.maintenanceMode} /> Bảo trì</label>
        <div>
          <Label htmlFor="reason">Lý do thay đổi (audit)</Label>
          <Input id="reason" name="reason" required className="mt-1" />
        </div>
        <Button type="submit">Lưu cài đặt</Button>
      </form>
    </div>
  );
}
