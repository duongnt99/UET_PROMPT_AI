"use client";

import { useActionState } from "react";
import {
  updateSubmissionReviewLimitAction,
  type SubmissionAdminActionState,
} from "@/server/actions/admin-submission-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

const idle: SubmissionAdminActionState = { ok: true, message: "" };

export function SubmissionReviewLimitForm({
  submissionId,
  submissionLimit,
  competitionDefault,
  effectiveLimit,
}: {
  submissionId: string;
  submissionLimit: number | null;
  competitionDefault: number;
  effectiveLimit: number;
}) {
  const [state, action, pending] = useActionState(updateSubmissionReviewLimitAction, idle);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <p className="text-sm text-slate-600">
        Hiện tại reviewer được nộp tối đa <strong>{effectiveLimit}</strong> lượt/bài này.
      </p>
      <div>
        <Label htmlFor="reviewSubmissionLimit">Số lượt nộp đánh giá tối đa / reviewer (bài này)</Label>
        <Input
          id="reviewSubmissionLimit"
          name="reviewSubmissionLimit"
          type="number"
          min={1}
          max={20}
          defaultValue={submissionLimit ?? ""}
          placeholder={`Mặc định: ${competitionDefault}`}
          disabled={pending}
          className="mt-1 max-w-xs"
        />
        <p className="mt-1 text-xs text-slate-500">
          Bao gồm lần nộp đầu. Lưu nháp không tính lượt. Để trống hoặc tick mặc định = dùng cài đặt toàn cuộc thi (
          {competitionDefault}).
        </p>
      </div>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="useDefault" defaultChecked={submissionLimit == null} disabled={pending} />
        Dùng mặc định toàn cuộc thi ({competitionDefault})
      </label>
      <div>
        <Label htmlFor="reason">Lý do (ghi nhật ký)</Label>
        <Input id="reason" name="reason" className="mt-1" placeholder="Ví dụ: Cho phép chấm lại bài này" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Đang lưu..." : "Lưu giới hạn lượt nộp"}</Button>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
