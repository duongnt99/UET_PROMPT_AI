"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import {
  createStaffAction,
  deleteStaffUserAction,
  revokeStaffRoleAction,
  updateStaffAction,
  type StaffActionState,
} from "@/server/actions/admin-staff-actions";
import { AdminDeleteForm } from "@/components/admin/delete-form";

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

export function CreateStaffForm({ role, roleLabel }: { role: "JUDGE" | "REVIEWER"; roleLabel: string }) {
  const [state, action, pending] = useActionState(createStaffAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="role" value={role} />
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor={`${role}-name`}>Họ và tên</Label>
          <Input id={`${role}-name`} name="fullName" required minLength={2} className="mt-1" />
        </div>
        <div>
          <Label htmlFor={`${role}-email`}>Email đăng nhập</Label>
          <Input id={`${role}-email`} name="email" type="email" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor={`${role}-password`}>Mật khẩu (≥ 10 ký tự)</Label>
          <Input
            id={`${role}-password`}
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${role}-reason`}>Lý do</Label>
          <Input id={`${role}-reason`} name="reason" required placeholder={`Thêm ${roleLabel}`} className="mt-1" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang tạo…" : `Thêm ${roleLabel}`}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function EditStaffForm({
  userId,
  email,
  name,
  role,
}: {
  userId: string;
  email: string;
  name: string;
  role: "JUDGE" | "REVIEWER";
}) {
  const [state, action, pending] = useActionState(updateStaffAction, idle);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeStaffRoleAction, idle);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor={`name-${userId}`}>Họ và tên</Label>
            <Input id={`name-${userId}`} name="fullName" required defaultValue={name} className="mt-1" />
          </div>
          <div>
            <Label htmlFor={`email-${userId}`}>Email</Label>
            <Input id={`email-${userId}`} name="email" type="email" required defaultValue={email} className="mt-1" />
          </div>
          <div>
            <Label htmlFor={`password-${userId}`}>Mật khẩu mới (để trống nếu giữ nguyên)</Label>
            <Input
              id={`password-${userId}`}
              name="password"
              type="password"
              minLength={10}
              autoComplete="new-password"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`edit-reason-${userId}`}>Lý do</Label>
            <Input id={`edit-reason-${userId}`} name="reason" required className="mt-1" />
          </div>
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu thông tin"}
        </Button>
        <Feedback state={state} pending={pending} />
      </form>
      <form action={revokeAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="role" value={role} />
        <div>
          <Label htmlFor={`revoke-reason-${userId}`}>Gỡ vai trò — lý do</Label>
          <Input id={`revoke-reason-${userId}`} name="reason" required className="mt-1" />
        </div>
        <Button type="submit" variant="outline" disabled={revokePending}>
          {revokePending ? "Đang gỡ…" : "Gỡ vai trò"}
        </Button>
        <Feedback state={revokeState} pending={revokePending} />
      </form>
    </div>
  );
}

export function StaffDeleteBlock({
  userId,
  role,
  email,
}: {
  userId: string;
  role: "JUDGE" | "REVIEWER";
  email: string;
}) {
  return (
    <AdminDeleteForm
      idPrefix={`staff-${userId}`}
      action={deleteStaffUserAction}
      hidden={{ userId, role }}
      warning={`Xóa hẳn ${email}. Nếu còn gắn trận/hồ sơ, hệ thống sẽ báo lỗi.`}
      submitLabel="Xóa tài khoản"
    />
  );
}
