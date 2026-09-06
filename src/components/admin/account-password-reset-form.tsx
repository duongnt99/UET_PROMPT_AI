"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import {
  resetUserPasswordAction,
  type StaffActionState,
} from "@/server/actions/admin-staff-actions";

const idle: StaffActionState = { ok: true, message: "" };

export function AccountPasswordResetForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(resetUserPasswordAction, idle);
  return (
    <form action={action} className="space-y-3 rounded-xl border p-4">
      <input type="hidden" name="userId" value={userId} />
      <p className="text-sm font-semibold">Đặt lại mật khẩu</p>
      <div>
        <Label htmlFor={`reset-password-${userId}`}>Mật khẩu mới</Label>
        <Input
          id={`reset-password-${userId}`}
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`reset-confirm-${userId}`}>Nhập lại mật khẩu</Label>
        <Input
          id={`reset-confirm-${userId}`}
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`reset-reason-${userId}`}>Lý do</Label>
        <Input id={`reset-reason-${userId}`} name="reason" required minLength={3} className="mt-1" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Đang đặt lại…" : "Đặt mật khẩu"}
      </Button>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
