import { requireUser } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration } from "@/server/services/registration-service";
import { Card } from "@/components/ui/form";

export default async function Page() {
  const user = await requireUser();
  const competition = await getProductionCompetition();
  const registration = competition ? await getMyRegistration(user.id, competition.id) : null;
  return (
    <div>
      <h1 className="display text-3xl">Đội thi</h1>
      {!registration?.team ? (
        <Card className="mt-6">Bạn chưa thuộc đội nào. Tạo đăng ký đội tại mục Đăng ký.</Card>
      ) : (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold">{registration.team.teamName}</h2>
          <p className="text-sm text-slate-600">Mã đội: {registration.team.teamCode}</p>
          <ul className="mt-4 space-y-1 text-sm">
            {registration.team.members.map((member) => (
              <li key={member.id}>
                {member.user.email} — {member.status}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
