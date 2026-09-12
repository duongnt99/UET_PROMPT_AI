"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import {
  advanceMatchWinnerAction,
  assignMatchJudgesAction,
  matchTimerAction,
  setCurrentMatchAction,
  setMatchStatusAction,
  stopMatchAction,
  updateMatchPairingAction,
  saveMatchProblemAction,
  assignChallengeToMatchAction,
  clearMatchProblemAction,
  publishMatchAction,
  unpublishMatchAction,
  type MatchSetupState,
} from "@/server/actions/admin-match-actions";
import { FIELD_LIMITS } from "@/config/field-limits";
import { contentStatusLabel, matchStatusLabel } from "@/lib/status-labels";

const idle: MatchSetupState = { ok: true, message: "" };

function Feedback({ state, pending }: { state: MatchSetupState; pending: boolean }) {
  if (pending) return <p className="text-sm text-slate-600">Đang lưu…</p>;
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

export function ChangePairingForm({
  matchId,
  competitorAId,
  competitorBId,
  finalists,
}: {
  matchId: string;
  competitorAId: string;
  competitorBId: string;
  finalists: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(updateMatchPairingAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="competitorAId">Đội A</Label>
          <select
            id="competitorAId"
            name="competitorAId"
            required
            defaultValue={competitorAId}
            className="mt-1 h-11 w-full rounded-xl border px-3"
          >
            <option value="">— Chọn —</option>
            {finalists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="competitorBId">Đội B</Label>
          <select
            id="competitorBId"
            name="competitorBId"
            required
            defaultValue={competitorBId}
            className="mt-1 h-11 w-full rounded-xl border px-3"
          >
            <option value="">— Chọn —</option>
            {finalists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="pairing-reason">Lý do</Label>
        <Input
          id="pairing-reason"
          name="reason"
          required
          maxLength={FIELD_LIMITS.AUDIT_REASON}
          placeholder="Đổi cặp vì…"
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Đổi cặp đấu"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function MatchStatusForm({
  matchId,
  currentStatus,
  nextStatuses,
}: {
  matchId: string;
  currentStatus: string;
  nextStatuses: string[];
}) {
  const [state, action, pending] = useActionState(setMatchStatusAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <Label htmlFor="status">Trạng thái mới</Label>
        <select id="status" name="status" required className="mt-1 h-11 w-full rounded-xl border px-3" defaultValue="">
          <option value="" disabled>
            Hiện tại: {matchStatusLabel(currentStatus)}
          </option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {matchStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="status-reason">Lý do</Label>
        <Input id="status-reason" name="reason" required maxLength={FIELD_LIMITS.AUDIT_REASON} className="mt-1" />
      </div>
      <Button type="submit" disabled={pending || nextStatuses.length === 0}>
        {pending ? "Đang lưu…" : "Đổi trạng thái"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function StopMatchForm({ matchId }: { matchId: string }) {
  const [state, action, pending] = useActionState(stopMatchAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <Label htmlFor="stop-reason">Lý do dừng trận</Label>
        <Input
          id="stop-reason"
          name="reason"
          required
          maxLength={FIELD_LIMITS.AUDIT_REASON}
          placeholder="Hủy vì sự cố / đổi lịch…"
          className="mt-1"
        />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Đang dừng…" : "Dừng và hủy trận"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function SetCurrentMatchForm({ matchId }: { matchId: string }) {
  const [state, action, pending] = useActionState(setCurrentMatchAction, idle);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="reason" value="Đặt trận hiện tại cho sân khấu" />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Đang đặt…" : "Đặt làm trận hiện tại"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function AssignJudgesForm({
  matchId,
  judges,
  assignedIds,
}: {
  matchId: string;
  judges: { id: string; label: string }[];
  assignedIds: string[];
}) {
  const [state, action, pending] = useActionState(assignMatchJudgesAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid gap-2 sm:grid-cols-2">
        {judges.map((judge) => (
          <label key={judge.id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="judgeIds"
              value={judge.id}
              defaultChecked={assignedIds.includes(judge.id)}
              className="size-4"
            />
            {judge.label}
          </label>
        ))}
      </div>
      <div>
        <Label htmlFor="judges-reason">Lý do</Label>
        <Input id="judges-reason" name="reason" required maxLength={FIELD_LIMITS.AUDIT_REASON} className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Cập nhật giám khảo"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function PublishMatchForm({
  matchId,
  publicStatus,
  scoresGloballyEnabled,
}: {
  matchId: string;
  publicStatus: string;
  scoresGloballyEnabled: boolean;
}) {
  const [publishState, publishAction, publishPending] = useActionState(publishMatchAction, idle);
  const [unpublishState, unpublishAction, unpublishPending] = useActionState(unpublishMatchAction, idle);
  const isPublished = publicStatus === "PUBLISHED";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Trạng thái công bố: <span className="font-semibold text-slate-900">{contentStatusLabel(publicStatus)}</span>
      </p>
      {isPublished ? (
        <p className="text-sm text-emerald-800">
          Trận đã công bố. Người xem có thể mở trang chi tiết trên Bảng đấu trực tiếp.
          {scoresGloballyEnabled
            ? " Điểm số hiển thị khi giám khảo đã nộp đủ phiếu."
            : " Bật “Công khai điểm trên Bảng đấu” ở trang Bảng đấu để hiện điểm."}
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Trận chưa công bố — điểm số và chi tiết chấm sẽ không hiện trên Bảng đấu công khai dù đã bật công khai điểm
          toàn cục.
        </p>
      )}

      {isPublished ? (
        <form action={unpublishAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <div>
            <Label htmlFor="unpublish-reason">Lý do ẩn công bố</Label>
            <Input
              id="unpublish-reason"
              name="reason"
              required
              maxLength={FIELD_LIMITS.AUDIT_REASON}
              defaultValue="Ẩn công bố trận trên Bảng đấu"
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="outline" disabled={unpublishPending}>
            {unpublishPending ? "Đang lưu…" : "Ẩn công bố trận"}
          </Button>
          <Feedback state={unpublishState} pending={unpublishPending} />
        </form>
      ) : publicStatus === "ARCHIVED" ? (
        <p className="text-sm text-slate-500">Trận đã lưu trữ, không thể công bố.</p>
      ) : (
        <form action={publishAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <div>
            <Label htmlFor="publish-reason">Lý do công bố</Label>
            <Input
              id="publish-reason"
              name="reason"
              required
              maxLength={FIELD_LIMITS.AUDIT_REASON}
              defaultValue="Công bố trận trên Bảng đấu trực tiếp"
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="primary" disabled={publishPending}>
            {publishPending ? "Đang lưu…" : "Công bố trận"}
          </Button>
          <Feedback state={publishState} pending={publishPending} />
        </form>
      )}
    </div>
  );
}

export function AdvanceWinnerForm({
  matchId,
  version,
  competitors,
}: {
  matchId: string;
  version: number;
  competitors: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(advanceMatchWinnerAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="version" value={String(version)} />
      <div>
        <Label htmlFor="winnerId">Đội thắng</Label>
        <select id="winnerId" name="winnerId" required className="mt-1 h-11 w-full rounded-xl border px-3">
          <option value="">— Chọn —</option>
          {competitors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="winner-reason">Lý do</Label>
        <Input
          id="winner-reason"
          name="reason"
          required
          maxLength={FIELD_LIMITS.AUDIT_REASON}
          placeholder="Theo điểm gộp / quyết định BTC"
          className="mt-1"
        />
      </div>
      <Button type="submit" variant="accent" disabled={pending || competitors.length < 1}>
        {pending ? "Đang lưu…" : "Công bố thắng cuộc"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function MatchTimerForm({
  matchId,
  kind,
}: {
  matchId: string;
  kind: "SPRINT" | "PITCH" | "VERDICT";
}) {
  const [state, action, pending] = useActionState(matchTimerAction, idle);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="kind" value={kind} />
      <Button name="action" value="start" size="sm" disabled={pending}>
        Bắt đầu
      </Button>
      <Button name="action" value="pause" size="sm" variant="outline" disabled={pending}>
        Tạm dừng
      </Button>
      <Button name="action" value="resume" size="sm" variant="outline" disabled={pending}>
        Tiếp tục
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function MatchProblemForm({
  matchId,
  title,
  prompt,
  challenges,
}: {
  matchId: string;
  title: string;
  prompt: string;
  challenges: { id: string; title: string }[];
}) {
  const [saveState, saveAction, savePending] = useActionState(saveMatchProblemAction, idle);
  const [assignState, assignAction, assignPending] = useActionState(assignChallengeToMatchAction, idle);
  const [clearState, clearAction, clearPending] = useActionState(clearMatchProblemAction, idle);
  return (
    <div className="space-y-6">
      {challenges.length ? (
        <form action={assignAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <div>
            <Label htmlFor="challengeId">Lấy từ kho đề</Label>
            <select id="challengeId" name="challengeId" required className="mt-1 h-11 w-full rounded-xl border px-3">
              <option value="">— Chọn đề —</option>
              {challenges.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="assign-reason">Lý do</Label>
            <Input
              id="assign-reason"
              name="reason"
              required
              maxLength={FIELD_LIMITS.AUDIT_REASON}
              defaultValue="Gán đề chung cho cặp đấu"
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="outline" disabled={assignPending}>
            {assignPending ? "Đang gán…" : "Gán đề vào trận"}
          </Button>
          <Feedback state={assignState} pending={assignPending} />
        </form>
      ) : (
        <p className="text-sm text-slate-600">
          Chưa có đề trong kho. Tạo tại <Link className="underline" href="/admin/challenges">Đề thi</Link> hoặc nhập trực tiếp
          bên dưới.
        </p>
      )}
      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="matchId" value={matchId} />
        <div>
          <Label htmlFor="problemTitle">Tiêu đề đề thi</Label>
          <Input
            id="problemTitle"
            name="problemTitle"
            required
            maxLength={FIELD_LIMITS.PROBLEM_TITLE}
            defaultValue={title}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="problemPrompt">Nội dung đề (cả hai đội)</Label>
          <Textarea
            id="problemPrompt"
            name="problemPrompt"
            required
            maxLength={FIELD_LIMITS.PROBLEM_PROMPT}
            defaultValue={prompt}
            className="mt-1 min-h-36"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="saveToLibrary" className="size-4" />
          Đồng thời lưu vào kho đề
        </label>
        <div>
          <Label htmlFor="problem-reason">Lý do</Label>
          <Input
            id="problem-reason"
            name="reason"
            required
            maxLength={FIELD_LIMITS.AUDIT_REASON}
            defaultValue="Cập nhật đề chung cho cặp đấu"
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={savePending}>
          {savePending ? "Đang lưu…" : "Lưu đề thi"}
        </Button>
        <Feedback state={saveState} pending={savePending} />
      </form>
      {title || prompt ? (
        <form action={clearAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <div>
            <Label htmlFor="clear-reason">Xóa đề khỏi trận</Label>
            <Input
              id="clear-reason"
              name="reason"
              required
              maxLength={FIELD_LIMITS.AUDIT_REASON}
              defaultValue="Gỡ đề thi khỏi cặp đấu"
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="destructive" disabled={clearPending}>
            {clearPending ? "Đang xóa…" : "Xóa đề trên trận này"}
          </Button>
          <Feedback state={clearState} pending={clearPending} />
        </form>
      ) : null}
    </div>
  );
}
