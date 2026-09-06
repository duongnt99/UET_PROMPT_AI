"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import {
  lockFinalistsAction,
  publishFinalistsAction,
  setFinalistPublishedAction,
  unselectFinalistAction,
} from "@/server/actions/admin-actions";

const idle = { ok: true, message: "" };

function Feedback({ state, pending }: { state: { ok: boolean; message: string }; pending: boolean }) {
  if (pending) return <p className="text-sm text-slate-600">Đang lưu…</p>;
  if (!state.message) return null;
  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
      {state.message}
    </p>
  );
}

export function LockFinalistsForm({
  candidates,
}: {
  candidates: { id: string; label: string; status: string; alreadySelected: boolean; rankHint: string }[];
}) {
  const [state, action, pending] = useActionState(lockFinalistsAction, idle);
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-slate-600">
        Tick hồ sơ rồi bấm khóa. Trạng thái hồ sơ → <strong>SELECTED</strong>, tạo bản ghi Finalist (chưa hiện trang
        công khai cho đến khi công bố). Bỏ tick tại đây không tự loại đội — dùng nút “Bỏ SELECTED” trên từng thẻ bên
        dưới.
      </p>
      <div className="max-h-80 space-y-1 overflow-auto rounded-xl border p-2">
        {candidates.length === 0 ? (
          <p className="p-2 text-sm text-slate-500">Chưa có hồ sơ nào để chọn.</p>
        ) : (
          candidates.map((item) => (
            <label key={item.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                name="registrationIds"
                value={item.id}
                defaultChecked={item.alreadySelected}
                className="mt-1 size-4"
              />
              <span>
                <span className="font-medium">{item.label}</span>
                <span className="block text-xs text-slate-500">
                  {item.status}
                  {item.rankHint ? ` · ${item.rankHint}` : ""}
                  {item.alreadySelected ? " · đang SELECTED" : ""}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
      <div>
        <Label htmlFor="lock-reason">Lý do (bắt buộc nếu chọn hồ sơ chưa Eligible / Under review)</Label>
        <Input id="lock-reason" name="reason" placeholder="Ví dụ: top 10 theo điểm Audition" className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang khóa…" : "Khóa lựa chọn finalist"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function PublishFinalistsForm() {
  const [state, action, pending] = useActionState(publishFinalistsAction, idle);
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-slate-600">
        Công bố mọi finalist đang SELECTED lên <code>/finalists</code> và gửi thông báo trong hệ thống.
      </p>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Đang công bố…" : "Công bố finalist"}
      </Button>
      <Feedback state={state} pending={pending} />
    </form>
  );
}

export function FinalistStatusForms({
  finalistId,
  published,
  selected,
}: {
  finalistId: string;
  published: boolean;
  selected: boolean;
}) {
  const [publishState, publishAction, publishPending] = useActionState(setFinalistPublishedAction, idle);
  const [unselectState, unselectAction, unselectPending] = useActionState(unselectFinalistAction, idle);
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <form action={publishAction} className="space-y-2">
        <input type="hidden" name="finalistId" value={finalistId} />
        <input type="hidden" name="published" value={published ? "false" : "true"} />
        <Label htmlFor={`pub-reason-${finalistId}`}>Lý do đổi công bố</Label>
        <Input
          id={`pub-reason-${finalistId}`}
          name="reason"
          required
          placeholder={published ? "Ẩn khỏi trang công khai" : "Hiện trên /finalists"}
          className="mt-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={publishPending || (!selected && !published)}>
          {publishPending ? "Đang lưu…" : published ? "Ẩn công khai" : "Công bố riêng"}
        </Button>
        <Feedback state={publishState} pending={publishPending} />
      </form>
      <form action={unselectAction} className="space-y-2">
        <input type="hidden" name="finalistId" value={finalistId} />
        <Label htmlFor={`unselect-reason-${finalistId}`}>Lý do bỏ khỏi chung kết</Label>
        <Input id={`unselect-reason-${finalistId}`} name="reason" required placeholder="Không vào vòng trong" className="mt-1" />
        <Button type="submit" variant="destructive" size="sm" disabled={unselectPending || !selected}>
          {unselectPending ? "Đang lưu…" : "Bỏ SELECTED"}
        </Button>
        <Feedback state={unselectState} pending={unselectPending} />
      </form>
    </div>
  );
}
