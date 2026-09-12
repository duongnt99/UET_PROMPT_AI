import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Badge, Card } from "@/components/ui/form";
import { requireAnyRole } from "@/lib/auth/guards";
import { hasPermission, type Role } from "@/server/domain/permissions";
import { formatDateTime } from "@/lib/dates";
import { formatScoreDisplay } from "@/server/domain/scoring";
import { MATCH_TRANSITIONS } from "@/server/domain/status-transitions";
import { finalizeMatchIfReady, getMatchTimerStates } from "@/server/services/match-service";
import { getActiveRubric } from "@/server/services/review-service";
import { getProductionCompetition } from "@/server/services/competition-service";
import {
  AdvanceWinnerForm,
  AssignJudgesForm,
  ChangePairingForm,
  MatchStatusForm,
  SetCurrentMatchForm,
  StopMatchForm,
  MatchProblemForm,
  PublishMatchForm,
} from "@/components/admin/match-admin-forms";
import { AdminMatchTimers } from "@/components/admin/admin-match-timers";
import { AdminDeleteForm } from "@/components/admin/delete-form";
import { deleteMatchAction } from "@/server/actions/admin-delete-actions";
import { contentStatusLabel, matchStatusLabel, reviewStatusLabel } from "@/lib/status-labels";
import { MatchDualScreenMonitor, type MatchScreenSide } from "@/components/live/match-dual-screen-monitor";

const finalistInclude = {
  registration: {
    include: {
      owner: { include: { profile: true } },
      team: { include: { members: { include: { user: { include: { profile: true } } } } } },
    },
  },
} as const;

function memberName(user: { name: string | null; email: string; profile: { fullName: string } | null }) {
  return user.profile?.fullName || user.name || user.email;
}

function SideCard({
  label,
  finalist,
  matchId,
}: {
  label: string;
  matchId: string;
  finalist: {
    id: string;
    displayName: string;
    institutionPublic: string | null;
    seed: number | null;
    registration: {
      id: string;
      code: string;
      type: "TEAM" | "INDIVIDUAL";
      status: string;
      owner: { email: string; name: string | null; profile: { fullName: string; phoneNumber: string | null; institution: string | null; facultyOrDepartment: string | null; major: string | null } | null };
      team: {
        id: string;
        teamName: string;
        teamCode: string;
        shortIntroduction: string | null;
        members: { roleLabel: string | null; status: string; user: { email: string; name: string | null; profile: { fullName: string } | null } }[];
      } | null;
    };
  } | null;
}) {
  if (!finalist) {
    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-slate-500">Chưa gán</p>
      </Card>
    );
  }
  const { registration } = finalist;
  const members =
    registration.team?.members.map((member) => ({
      name: memberName(member.user),
      email: member.user.email,
      role: member.roleLabel ?? "Thành viên",
      status: member.status,
    })) ?? [
      {
        name: memberName(registration.owner),
        email: registration.owner.email,
        role: "Thí sinh",
        status: "OWNER",
      },
    ];
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <h2 className="mt-1 text-xl font-semibold">{finalist.displayName}</h2>
      <p className="text-sm text-slate-600">
        {registration.code} · {registration.type === "TEAM" ? "Đội" : "Cá nhân"} · {registration.status}
        {finalist.seed != null ? ` · seed ${finalist.seed}` : ""}
      </p>
      <p className="mt-1 text-sm">{finalist.institutionPublic || registration.owner.profile?.institution || "—"}</p>
      {registration.owner.profile?.facultyOrDepartment || registration.owner.profile?.major ? (
        <p className="text-sm text-slate-600">
          {[registration.owner.profile?.facultyOrDepartment, registration.owner.profile?.major].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {registration.team?.shortIntroduction ? (
        <p className="mt-2 text-sm text-slate-700">{registration.team.shortIntroduction}</p>
      ) : null}
      <ul className="mt-3 space-y-1 text-sm">
        {members.map((member) => (
          <li key={member.email}>
            {member.name} — {member.email}
            <span className="text-slate-500"> · {member.role}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <Link href={`/admin/registrations/${registration.id}`} className="underline">
          Mở hồ sơ đăng ký
        </Link>
        {" · "}
        <Link href={`/admin/bracket/${matchId}/theo-doi/${registration.id}`} className="font-semibold text-blue-700 underline">
          Theo dõi màn hình trực tiếp
        </Link>
      </p>
    </Card>
  );
}

function matchScreenSide(
  side: "A" | "B",
  finalist: {
    displayName: string;
    registration: {
      id: string;
      owner: { id: string; name: string | null; email: string; profile: { fullName: string } | null };
      team: {
        leaderUserId: string;
        members: {
          status: string;
          user: { id: string; name: string | null; email: string; profile: { fullName: string } | null };
        }[];
      } | null;
    };
  },
): MatchScreenSide {
  const { registration } = finalist;
  const preferredParticipant = registration.team
    ? registration.team.members.find((member) => member.user.id === registration.team?.leaderUserId)?.user
      ?? registration.team.members.find((member) => member.status === "ACCEPTED")?.user
      ?? registration.owner
    : registration.owner;
  return {
    side,
    registrationId: registration.id,
    competitorName: finalist.displayName,
    preferredParticipantId: preferredParticipant.id,
    preferredParticipantName: memberName(preferredParticipant),
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAnyRole(["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"]);
  const roles = user.roles as Role[];
  const canManage = hasPermission(roles, "bracket:manage");
  const canStage = hasPermission(roles, "stage:control");
  const canAssignJudges = hasPermission(roles, "judge:assign");
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      round: true,
      competitorA: { include: finalistInclude },
      competitorB: { include: finalistInclude },
      winner: true,
      nextMatch: true,
      timers: { orderBy: { kind: "asc" } },
      twists: true,
      judgeAssignments: {
        include: {
          judge: true,
          scores: { include: { items: true } },
        },
      },
    },
  });
  if (!match) notFound();

  const [summary, rubric, competition, finalists, judges, challengeOptions, timerStates] = await Promise.all([
    finalizeMatchIfReady(match.id),
    getActiveRubric(match.competitionId, "FINAL"),
    getProductionCompetition(),
    prisma.finalist.findMany({
      where: { competitionId: match.competitionId, registration: { status: "SELECTED" } },
      include: { registration: true },
      orderBy: { seed: "asc" },
    }),
    prisma.roleAssignment.findMany({
      where: { role: "JUDGE", revokedAt: null },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.matchChallenge.findMany({
      where: { competitionId: match.competitionId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    getMatchTimerStates(match.id),
  ]);
  const isCurrent = competition?.settings.currentMatchId === match.id;
  const nextStatuses = MATCH_TRANSITIONS[match.status] ?? [];
  const canStop = !["CANCELLED", "COMPLETED", "PUBLISHED", "LOCKED"].includes(match.status);
  const canChangePairing =
    canManage && !["COMPLETED", "PUBLISHED", "LOCKED", "CANCELLED"].includes(match.status);
  const submittedCount = match.judgeAssignments.filter((item) => item.status === "SUBMITTED").length;
  const dualScreenSides = match.competitorA && match.competitorB
    ? [matchScreenSide("A", match.competitorA), matchScreenSide("B", match.competitorB)] as [MatchScreenSide, MatchScreenSide]
    : null;

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/admin/bracket" className="text-slate-600 underline">
          ← Bảng đấu
        </Link>
        {" · "}
        <Link href="/admin/scoring" className="text-slate-600 underline">
          Chấm chung kết
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="display text-3xl">
          {match.round.displayName} · {match.code}
        </h1>
        <Badge tone={match.status === "SCORING" ? "gold" : match.status === "COMPLETED" ? "green" : match.status === "CANCELLED" ? "red" : "slate"}>
          {matchStatusLabel(match.status)}
        </Badge>
        {isCurrent ? <Badge tone="blue">Trận hiện tại</Badge> : null}
        {match.winner ? <Badge tone="green">Thắng: {match.winner.displayName}</Badge> : null}
        <Badge tone={match.publicStatus === "PUBLISHED" ? "green" : "gold"}>
          Công bố: {contentStatusLabel(match.publicStatus)}
        </Badge>
      </div>
      <p className="text-sm text-slate-600">
        Bắt đầu: {formatDateTime(match.actualStartedAt)} · Kết thúc: {formatDateTime(match.actualEndedAt)}
        {match.nextMatch ? ` · Thắng vào ${match.nextMatch.code} (${match.nextSlot ?? "?"})` : ""}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <SideCard label="Đội A" finalist={match.competitorA} matchId={match.id} />
        <SideCard label="Đội B" finalist={match.competitorB} matchId={match.id} />
      </div>

      {dualScreenSides ? (
        <MatchDualScreenMonitor contestSessionId={match.id} sides={dualScreenSides} />
      ) : null}

      {canManage ? (
        <Card>
          <h2 className="font-semibold">Đề thi chung cho cặp đấu</h2>
          <p className="mt-1 text-sm text-slate-600">
            Hai đội nhận cùng một đề. Nội dung này hiện trên sân khấu và overlay.
          </p>
          <div className="mt-3">
            <MatchProblemForm
              matchId={match.id}
              title={match.problemTitle}
              prompt={match.problemPrompt}
              challenges={challengeOptions}
            />
          </div>
        </Card>
      ) : match.problemTitle || match.problemPrompt ? (
        <Card>
          <h2 className="font-semibold">Đề thi chung</h2>
          <p className="mt-2 text-lg font-medium">{match.problemTitle}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{match.problemPrompt}</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Kết quả chấm</h2>
        <p className="mt-1 text-sm text-slate-600">
          Điểm gộp = trung bình phiếu đã nộp. Cần {competition?.settings.numberOfJudgesPerMatch ?? 3} giám khảo nộp đủ
          mới chốt.
        </p>
        <p className="mt-2 text-sm">
          Đã nộp: {submittedCount}/{match.judgeAssignments.length}
        </p>
        {summary.ready ? (
          <p className="mt-2 text-lg font-semibold">
            {match.competitorA?.displayName ?? "A"} {formatScoreDisplay(summary.aggregateA)} —{" "}
            {match.competitorB?.displayName ?? "B"} {formatScoreDisplay(summary.aggregateB)}
            <span className="ml-2 text-sm font-normal text-slate-600">
              {summary.tieState === "A" || summary.tieState === "B"
                ? `Gợi ý thắng: ${summary.tieState === "A" ? match.competitorA?.displayName : match.competitorB?.displayName}`
                : `Hòa / ${summary.tieState}`}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">Chưa đủ phiếu để chốt điểm gộp.</p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 pr-3">Giám khảo</th>
                <th className="py-2 pr-3">Phiếu</th>
                <th className="py-2 pr-3">{match.competitorA?.displayName ?? "A"}</th>
                <th className="py-2 pr-3">{match.competitorB?.displayName ?? "B"}</th>
              </tr>
            </thead>
            <tbody>
              {match.judgeAssignments.map((assignment) => {
                const scoreA = assignment.scores.find((score) => score.competitorId === match.competitorAId);
                const scoreB = assignment.scores.find((score) => score.competitorId === match.competitorBId);
                return (
                  <tr key={assignment.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3">{assignment.judge.name || assignment.judge.email}</td>
                    <td className="py-2 pr-3">{reviewStatusLabel(assignment.status)}</td>
                    <td className="py-2 pr-3">
                      {scoreA ? formatScoreDisplay(scoreA.totalNormalized.toString()) : "—"}
                      {scoreA?.overallComment ? (
                        <span className="mt-1 block text-xs text-slate-500">{scoreA.overallComment}</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">
                      {scoreB ? formatScoreDisplay(scoreB.totalNormalized.toString()) : "—"}
                      {scoreB?.overallComment ? (
                        <span className="mt-1 block text-xs text-slate-500">{scoreB.overallComment}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rubric && match.judgeAssignments.some((item) => item.scores.length) ? (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium">Chi tiết tiêu chí</summary>
            <div className="mt-2 space-y-3">
              {match.judgeAssignments.flatMap((assignment) =>
                assignment.scores.map((score) => (
                  <div key={score.id} className="rounded-xl border p-3">
                    <p className="font-medium">
                      {assignment.judge.email} →{" "}
                      {score.competitorId === match.competitorAId
                        ? match.competitorA?.displayName
                        : match.competitorB?.displayName}{" "}
                      ({score.status})
                    </p>
                    <ul className="mt-1 text-slate-700">
                      {rubric.criteria.map((criterion) => {
                        const item = score.items.find((row) => row.criterionId === criterion.id);
                        return (
                          <li key={criterion.id}>
                            {criterion.titleVi}: {item ? item.rawScore.toString() : "—"}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )),
              )}
            </div>
          </details>
        ) : null}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Đồng hồ thi đấu</h2>
          <Link href="/admin/settings" className="text-sm text-slate-600 underline">
            Đổi thời lượng mặc định
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Thời lượng mặc định lấy từ Cài đặt cuộc thi. Đồng hồ chưa chạy hoặc đang tạm dừng sẽ được cập nhật khi
          lưu cài đặt; đồng hồ đang chạy hoặc đã kết thúc giữ nguyên.
        </p>
        <AdminMatchTimers matchId={match.id} initialTimers={timerStates} canControl={canStage} />
        {canStage && match.status !== "CANCELLED" ? (
          <div className="mt-4">
            <SetCurrentMatchForm matchId={match.id} />
          </div>
        ) : null}
      </Card>

      {canManage ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-semibold">Công bố trận</h2>
            <p className="mt-1 text-sm text-slate-600">
              Cho phép hiển thị điểm số chi tiết của trận này trên Bảng đấu trực tiếp (cần bật công khai điểm toàn cục).
            </p>
            <div className="mt-3">
              <PublishMatchForm
                matchId={match.id}
                publicStatus={match.publicStatus}
                scoresGloballyEnabled={competition?.settings.publicScoresEnabled ?? false}
              />
            </div>
          </Card>
          {canChangePairing ? (
            <Card>
              <h2 className="font-semibold">Đổi cặp đấu</h2>
              <p className="mt-1 text-sm text-slate-600">
                Không đổi được nếu đã có phiếu nộp. Phiếu nháp của đội bị thay sẽ bị xóa.
              </p>
              <div className="mt-3">
                <ChangePairingForm
                  matchId={match.id}
                  competitorAId={match.competitorAId ?? ""}
                  competitorBId={match.competitorBId ?? ""}
                  finalists={finalists.map((item) => ({
                    id: item.id,
                    label: `${item.displayName} (${item.registration.code})`,
                  }))}
                />
              </div>
            </Card>
          ) : null}
          <Card>
            <h2 className="font-semibold">Trạng thái trận</h2>
            <div className="mt-3">
              <MatchStatusForm matchId={match.id} currentStatus={match.status} nextStatuses={nextStatuses} />
            </div>
          </Card>
          {canStop ? (
            <Card>
              <h2 className="font-semibold">Dừng trận</h2>
              <p className="mt-1 text-sm text-slate-600">
                Hủy trận, tạm dừng đồng hồ và gỡ khỏi sân khấu nếu đây là trận hiện tại. Điểm đã nộp được giữ.
              </p>
              <div className="mt-3">
                <StopMatchForm matchId={match.id} />
              </div>
            </Card>
          ) : null}
          <Card>
            <h2 className="font-semibold">Công bố thắng cuộc</h2>
            <p className="mt-1 text-sm text-slate-600">
              Kết thúc trận. Nếu có trận tiếp theo, đội thắng được đưa vào vị trí đã cấu hình.
            </p>
            <div className="mt-3">
              <AdvanceWinnerForm
                matchId={match.id}
                version={match.version}
                competitors={[match.competitorA, match.competitorB]
                  .filter(Boolean)
                  .map((item) => ({ id: item!.id, label: item!.displayName }))}
              />
            </div>
          </Card>
        </div>
      ) : null}

      {canAssignJudges ? (
        <Card>
          <h2 className="font-semibold">Giám khảo</h2>
          <p className="mt-1 text-sm text-slate-600">Không gỡ được người đã nộp phiếu.</p>
          <div className="mt-3">
            <AssignJudgesForm
              matchId={match.id}
              assignedIds={match.judgeAssignments.map((item) => item.judgeId)}
              judges={judges.map((item) => ({
                id: item.user.id,
                label: item.user.name ? `${item.user.name} — ${item.user.email}` : item.user.email,
              }))}
            />
          </div>
        </Card>
      ) : null}

      {canManage ? (
        <Card>
          <h2 className="font-semibold">Xóa cặp đấu</h2>
          <p className="mt-1 text-sm text-slate-600">
            Xóa hẳn trận {match.code}, phiếu, timer và phân công giám khảo. Trận khác đang trỏ winner vào đây sẽ mất liên
            kết.
          </p>
          <div className="mt-3">
            <AdminDeleteForm
              idPrefix={`match-${match.id}`}
              action={deleteMatchAction}
              hidden={{ matchId: match.id }}
              warning="Thao tác không hoàn tác. Nếu chỉ muốn dừng thi, dùng Dừng trận."
              submitLabel="Xóa trận"
            />
          </div>
        </Card>
      ) : null}

      {match.twists.length ? (
        <Card>
          <h2 className="font-semibold">Yêu cầu bất ngờ trên sân khấu</h2>
          <ul className="mt-2 text-sm">
            {match.twists.map((twist) => (
              <li key={twist.id}>
                {twist.title} · {twist.status}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
