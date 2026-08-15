"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import {
  assignReviewerAction,
  unassignReviewerAction,
  type StaffActionState,
} from "@/server/actions/admin-staff-actions";

const idle: StaffActionState = { ok: true, message: "" };

function Feedback({ state, pending }: { state: StaffActionState; pending: boolean }) {
  if (pending) return <p className="text-sm text-slate-600">Đang lưu…</p>;
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

export function AssignReviewerForm({
  submissions,
  reviewers,
}: {
  submissions: { id: string; label: string }[];
  reviewers: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(assignReviewerAction, idle);
  if (!submissions.length) {
    return <p className="text-sm text-amber-700">Chưa có bài Audition để gán.</p>;
  }
  if (!reviewers.length) {
    return (
      <p className="text-sm text-amber-700">
        Chưa có reviewer. Thêm tại <a className="underline" href="/admin/reviewers">Reviewer</a>.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="submissionId">Đội / hồ sơ (bài Audition)</Label>
          <select id="submissionId" name="submissionId" required className="mt-1 h-11 w-full rounded-xl border px-3">
            <option value="">— Chọn —</option>
            {submissions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="reviewerId">Reviewer</Label>
          <select id="reviewerId" name="reviewerId" required className="mt-1 h-11 w-full rounded-xl border px-3">
            <option value="">— Chọn —</option>
            {reviewers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang gán…" : "Gán reviewer"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function UnassignReviewerForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, pending] = useActionState(unassignReviewerAction, idle);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Đang gỡ…" : "Gỡ"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}
