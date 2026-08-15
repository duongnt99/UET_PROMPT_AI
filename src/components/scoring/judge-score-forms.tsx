"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  saveJudgeDraftAction,
  submitJudgeScoreAction,
  type JudgeActionState,
} from "@/server/actions/judge-actions";

const idle: JudgeActionState = { ok: true, message: "" };

function ActionMessage({ state }: { state: JudgeActionState }) {
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

export function JudgeDraftForm({
  assignmentId,
  competitorId,
  matchId,
  locked,
  overallComment,
  criteria,
}: {
  assignmentId: string;
  competitorId: string;
  matchId: string;
  locked: boolean;
  overallComment: string;
  criteria: { id: string; titleVi: string; weight: string; rawScore: string }[];
}) {
  const [state, action, pending] = useActionState(saveJudgeDraftAction, idle);
  return (
    <form className="mt-3 space-y-2" action={action}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="competitorId" value={competitorId} />
      <input type="hidden" name="matchId" value={matchId} />
      {criteria.map((c) => (
        <label key={c.id} className="block text-sm">
          {c.titleVi} ({c.weight}%)
          <input
            name={`score-${c.id}`}
            type="number"
            step="0.5"
            min="0"
            max="10"
            required
            defaultValue={c.rawScore}
            disabled={locked}
            className="mt-1 h-11 w-full rounded-xl border px-3"
          />
        </label>
      ))}
      <textarea
        name="overallComment"
        className="w-full rounded-xl border p-2"
        disabled={locked}
        defaultValue={overallComment}
        placeholder="Nhận xét tổng (không bắt buộc)"
      />
      <Button type="submit" disabled={locked || pending} variant="outline">
        {pending ? "Đang lưu…" : "Lưu nháp"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function JudgeSubmitForm({
  assignmentId,
  matchId,
  locked,
  canSubmit,
}: {
  assignmentId: string;
  matchId: string;
  locked: boolean;
  canSubmit: boolean;
}) {
  const [state, action, pending] = useActionState(submitJudgeScoreAction, idle);
  return (
    <form className="mt-4 space-y-2" action={action}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="matchId" value={matchId} />
      <Button type="submit" disabled={locked || pending || !canSubmit}>
        {pending ? "Đang nộp…" : "Nộp điểm trận"}
      </Button>
      {!canSubmit && !locked ? (
        <p className="text-sm text-amber-700">Cần bấm Lưu nháp cho đủ cả hai bên trước khi nộp.</p>
      ) : null}
      <ActionMessage state={state} />
    </form>
  );
}
