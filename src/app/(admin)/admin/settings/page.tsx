import { getProductionCompetition } from "@/server/services/competition-service";
import { CompetitionSettingsForm } from "@/components/admin/competition-settings-form";
import { requirePermission } from "@/lib/auth/guards";

export default async function Page() {
  await requirePermission("settings:read");
  const competition = await getProductionCompetition();
  if (!competition) {
    return (
      <div>
        <h1 className="display text-3xl">Cài đặt cuộc thi</h1>
        <p className="mt-4 text-sm text-slate-600">Chưa có cấu hình cuộc thi production.</p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="display text-3xl">Cài đặt cuộc thi</h1>
      <div className="mt-6">
        <CompetitionSettingsForm settings={competition.settings} />
      </div>
    </div>
  );
}
