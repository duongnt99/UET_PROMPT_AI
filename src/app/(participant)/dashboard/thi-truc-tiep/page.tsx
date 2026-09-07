import { requireUser } from "@/lib/auth/guards";
import { Card, Badge } from "@/components/ui/form";
import { ParticipantScreenShare } from "@/components/live/participant-screen-share";
import { getParticipantLiveScreenContext } from "@/server/services/live-screen-service";
import { matchStatusLabel } from "@/lib/status-labels";

export default async function Page() {
  const user = await requireUser();
  const context = await getParticipantLiveScreenContext(user.id);
  if (!context) {
    return (
      <div>
        <h1 className="display text-3xl">Thi trực tiếp</h1>
        <Card className="mt-6">
          <p className="font-semibold">Chưa có phiên thi dành cho đội của bạn.</p>
          <p className="mt-2 text-sm text-slate-600">Khu vực chia sẻ màn hình sẽ mở khi Ban Tổ chức chọn trận hiện tại.</p>
        </Card>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="display text-3xl">Thi trực tiếp · {context.matchCode}</h1>
        <Badge tone={context.canShare ? "green" : "slate"}>{matchStatusLabel(context.matchStatus)}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {context.registrationType === "TEAM" ? "Đội" : "Thí sinh"}: {context.competitorName}
      </p>
      <Card className="mt-6">
        <h2 className="text-xl font-semibold">{context.problemTitle || "Đề thi đang được chuẩn bị"}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {context.problemPrompt || "Ban Tổ chức chưa công bố nội dung đề."}
        </p>
      </Card>
      <ParticipantScreenShare contestSessionId={context.contestSessionId} canShare={context.canShare} />
    </div>
  );
}
