"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import type { AdminDeleteState } from "@/server/actions/admin-delete-actions";

const idle: AdminDeleteState = { ok: true, message: "" };

export function AdminDeleteForm({
  action,
  hidden,
  warning,
  submitLabel,
  idPrefix,
}: {
  action: (prev: AdminDeleteState, formData: FormData) => Promise<AdminDeleteState> | Promise<{ ok: boolean; message: string }>;
  hidden: Record<string, string>;
  warning: string;
  submitLabel: string;
  idPrefix: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  return (
    <form action={formAction} className="space-y-3">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <p className="text-sm text-red-800">{warning}</p>
      <div>
        <Label htmlFor={`${idPrefix}-confirm`}>Gõ XOA để xác nhận</Label>
        <Input
          id={`${idPrefix}-confirm`}
          name="confirm"
          required
          placeholder="XOA"
          className="mt-1"
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-reason`}>Lý do (audit)</Label>
        <Input id={`${idPrefix}-reason`} name="reason" required placeholder="Vì sao xóa" className="mt-1" />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Đang xóa…" : submitLabel}
      </Button>
      {pending ? <p className="text-sm text-slate-600">Đang xử lý…</p> : null}
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
