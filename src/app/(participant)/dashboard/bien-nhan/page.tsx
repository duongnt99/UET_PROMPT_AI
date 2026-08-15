import { requireUser } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration } from "@/server/services/registration-service";
import { Card } from "@/components/ui/form";
import { formatDateTime } from "@/lib/dates";

export default async function Page() {
  const user = await requireUser();
  const competition = await getProductionCompetition();
  const registration = competition ? await getMyRegistration(user.id, competition.id) : null;
  return (
    <div>
      <h1 className="display text-3xl">Biên nhận</h1>
      <Card className="mt-6 print:shadow-none">
        {!registration?.submittedAt ? (
          <p>Chưa có biên nhận. Hãy nộp hồ sơ trước.</p>
        ) : (
          <div>
            <p className="text-sm text-slate-500">Prompt-Off: Vietnam 2026</p>
            <h2 className="mt-2 text-2xl font-semibold">Biên nhận đăng ký</h2>
            <p className="mt-4">Mã hồ sơ: {registration.code}</p>
            <p>Trạng thái: {registration.status}</p>
            <p>Thời điểm nộp (server): {formatDateTime(registration.submittedAt)}</p>
            <p className="mt-6 text-sm">In trang này để lưu hồ sơ.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
