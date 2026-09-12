"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { FIELD_LIMITS } from "@/config/field-limits";
import { saveChallengeAction, type ChallengeActionState } from "@/server/actions/admin-challenge-actions";

const idle: ChallengeActionState = { ok: true, message: "" };

export function ChallengeForm({
  challenge,
}: {
  challenge?: { id: string; title: string; prompt: string; notes: string };
}) {
  const [state, action, pending] = useActionState(saveChallengeAction, idle);
  return (
    <form action={action} className="space-y-4">
      {challenge ? <input type="hidden" name="id" value={challenge.id} /> : null}
      <div>
        <Label htmlFor="title">Tiêu đề đề thi</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={FIELD_LIMITS.PROBLEM_TITLE}
          defaultValue={challenge?.title}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="prompt">Nội dung (cả hai đội nhận cùng đề)</Label>
        <Textarea
          id="prompt"
          name="prompt"
          required
          maxLength={FIELD_LIMITS.PROBLEM_PROMPT}
          defaultValue={challenge?.prompt}
          className="mt-1 min-h-40"
        />
      </div>
      <div>
        <Label htmlFor="notes">Ghi chú nội bộ (không hiện sân khấu)</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={FIELD_LIMITS.CHALLENGE_NOTES}
          defaultValue={challenge?.notes}
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : challenge ? "Lưu đề thi" : "Tạo đề thi"}
      </Button>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
