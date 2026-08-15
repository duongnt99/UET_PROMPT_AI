import { getProductionCompetition } from "@/server/services/competition-service";
import { saveSettingsAction } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { requirePermission } from "@/lib/auth/guards";

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
