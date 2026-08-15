"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import {
  changeMemberEmailAction,
  changeRegistrationStatusAction,
  renameTeamAction,
  setMemberPasswordAction,
  type AdminSupportState,
} from "@/server/actions/admin-support-actions";

const idle: AdminSupportState = { ok: true, message: "" };

function Feedback({ state, pending }: { state: AdminSupportState; pending: boolean }) {
  if (pending) return <p className="text-sm text-slate-600">Đang lưu…</p>;
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

export function RenameTeamForm({
  registrationId,
  teamName,
}: {
  registrationId: string;
  teamName: string;
}) {
  const [state, action, pending] = useActionState(renameTeamAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="registrationId" value={registrationId} />
      <div>
        <Label htmlFor="teamName">Tên đội</Label>
        <Input id="teamName" name="teamName" required minLength={2} defaultValue={teamName} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="rename-reason">Lý do (audit)</Label>
        <Input id="rename-reason" name="reason" required placeholder="Ví dụ: đội gõ nhầm tên" className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Đổi tên đội"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function MemberAccountForms({
  registrationId,
  userId,
  email,
}: {
  registrationId: string;
  userId: string;
  email: string;
}) {
  const [passwordState, passwordAction, passwordPending] = useActionState(setMemberPasswordAction, idle);
  const [emailState, emailAction, emailPending] = useActionState(changeMemberEmailAction, idle);
  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      <form action={emailAction} className="space-y-3">
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="userId" value={userId} />
        <p className="text-sm font-medium">Đổi email đăng nhập</p>
        <div>
          <Label htmlFor={`email-${userId}`}>Email mới</Label>
          <Input id={`email-${userId}`} name="email" type="email" required defaultValue={email} className="mt-1" />
        </div>
        <div>
          <Label htmlFor={`email-reason-${userId}`}>Lý do</Label>
          <Input id={`email-reason-${userId}`} name="reason" required placeholder="Gõ nhầm email" className="mt-1" />
        </div>
        <Button type="submit" variant="outline" disabled={emailPending}>
          {emailPending ? "Đang lưu…" : "Đổi email"}
        </Button>
        <Feedback state={emailState} pending={emailPending} />
      </form>
      <form action={passwordAction} className="space-y-3">
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="userId" value={userId} />
        <p className="text-sm font-medium">Đặt mật khẩu mới</p>
        <div>
          <Label htmlFor={`password-${userId}`}>Mật khẩu mới (≥ 10 ký tự)</Label>
          <Input
            id={`password-${userId}`}
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`confirm-${userId}`}>Nhập lại mật khẩu</Label>
          <Input
            id={`confirm-${userId}`}
            name="confirmPassword"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`password-reason-${userId}`}>Lý do</Label>
          <Input
            id={`password-reason-${userId}`}
            name="reason"
            required
            placeholder="Đội quên mật khẩu"
            className="mt-1"
          />
        </div>
        <Button type="submit" variant="outline" disabled={passwordPending}>
          {passwordPending ? "Đang lưu…" : "Đặt mật khẩu"}
        </Button>
        <Feedback state={passwordState} pending={passwordPending} />
      </form>
    </div>
  );
}

export function RegistrationStatusForm({ registrationId }: { registrationId: string }) {
  const [state, action, pending] = useActionState(changeRegistrationStatusAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="registrationId" value={registrationId} />
      <div>
        <Label htmlFor="toStatus">Trạng thái mới</Label>
        <select id="toStatus" name="toStatus" className="mt-1 h-11 w-full rounded-xl border px-3">
          <option value="NEEDS_UPDATE">Yêu cầu cập nhật</option>
          <option value="ELIGIBLE">Eligible</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="SELECTED">Selected</option>
          <option value="NOT_SELECTED">Not selected</option>
        </select>
      </div>
      <div>
        <Label htmlFor="status-reason">Lý do</Label>
        <Input id="status-reason" name="reason" required className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Cập nhật trạng thái"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}
