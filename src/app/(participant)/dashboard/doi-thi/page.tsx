import { requireUser } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration, getPendingTeamInvitations } from "@/server/services/registration-service";
import { Card } from "@/components/ui/form";
import { TeamInvitationActions } from "@/components/forms/team-invitation-actions";
import { formatDateTime } from "@/lib/dates";

export default async function Page() {
  const user = await requireUser();
  const competition = await getProductionCompetition();
  const [registration, invitations] = await Promise.all([
    competition ? getMyRegistration(user.id, competition.id) : null,
    getPendingTeamInvitations(user.id),
  ]);
  return (
    <div>
      <h1 className="display text-3xl">Đội thi</h1>
      {invitations.length ? (
        <div className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold">Lời mời đang chờ</h2>
          {invitations.map((invitation) => {
            const conflict = Boolean(
              registration && registration.id !== invitation.team.registration?.id,
            );
            return (
              <Card key={invitation.id}>
                <p className="font-semibold">{invitation.team.teamName}</p>
                <p className="text-sm text-slate-600">
                  Người mời: {invitation.invitedBy.name || invitation.invitedBy.email}
                </p>
                <p className="text-xs text-slate-500">Hết hạn: {formatDateTime(invitation.expiresAt)}</p>
                <TeamInvitationActions invitationId={invitation.id} hasRegistrationConflict={conflict} />
              </Card>
            );
          })}
        </div>
      ) : null}
      {!registration?.team ? (
        <Card className="mt-6">
          {registration
            ? "Bạn đang có hồ sơ cá nhân nên không thể đồng thời tham gia một đội khác."
            : "Bạn chưa thuộc đội nào. Tạo đăng ký đội hoặc chấp nhận lời mời tại đây."}
        </Card>
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
