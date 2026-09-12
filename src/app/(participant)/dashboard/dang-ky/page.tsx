import { requireUser } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration } from "@/server/services/registration-service";
import { RegistrationWizard } from "@/components/forms/registration-wizard";

export default async function Page() {
  const user = await requireUser();
  const competition = await getProductionCompetition();
  const registration = competition ? await getMyRegistration(user.id, competition.id) : null;
  return (
    <div>
      <h1 className="display text-3xl">Đăng ký dự thi</h1>
      <p className="mt-2 text-slate-600">Wizard có lưu hồ sơ cá nhân riêng tại mục Hồ sơ. Hạn nộp được kiểm tra phía máy chủ.</p>
      <div className="mt-6 rounded-2xl border bg-white p-6">
        <RegistrationWizard
          hasRegistration={Boolean(registration)}
          status={registration?.status}
          mode={competition?.settings.registrationMode ?? "UNDECIDED"}
          teamName={registration?.team?.teamName}
          registrationCode={registration?.code}
          registrationType={registration?.type}
          submittedAt={registration?.submittedAt}
          teamMinSize={competition?.settings.teamMinSize ?? 2}
          teamMaxSize={competition?.settings.teamMaxSize ?? 3}
          allowEditAfterSubmit={competition?.settings.allowParticipantEditAfterSubmit ?? false}
          teamMembers={
            registration?.team?.members.map((member) => ({
              email: member.user.email,
              status: member.status,
              roleLabel: member.roleLabel,
            })) ?? []
          }
        />
      </div>
    </div>
  );
}
