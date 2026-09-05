"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { createScoringMatchAction, type MatchSetupState } from "@/server/actions/admin-match-actions";

const idle: MatchSetupState = { ok: true, message: "" };

export function CreateScoringMatchForm({
  finalists,
  judges,
  rounds,
  judgesPerMatch,
  challenges,
}: {
  finalists: { id: string; label: string }[];
  judges: { id: string; label: string }[];
  rounds: { id: string; label: string }[];
  judgesPerMatch: number;
  challenges: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(createScoringMatchAction, idle);
  if (finalists.length < 2) {
    return (
      <p className="text-sm text-amber-700">
        Cần ít nhất hai finalist đang SELECTED. Vào <a className="underline" href="/admin/finalists">Finalist</a> để
        chọn đội.
      </p>
    );
  }
  if (!judges.length) {
    return (
      <p className="text-sm text-amber-700">
        Chưa có tài khoản vai trò JUDGE. Thêm giám khảo trước khi mở trận.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="competitorAId">Đội / thí sinh A</Label>
          <select id="competitorAId" name="competitorAId" required className="mt-1 h-11 w-full rounded-xl border px-3">
            <option value="">— Chọn —</option>
            {finalists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="competitorBId">Đội / thí sinh B</Label>
          <select id="competitorBId" name="competitorBId" required className="mt-1 h-11 w-full rounded-xl border px-3">
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
        <Label htmlFor="roundId">Vòng</Label>
        <select id="roundId" name="roundId" className="mt-1 h-11 w-full rounded-xl border px-3">
          <option value="">Tự chọn vòng đầu tiên / tạo “Trận tùy chọn”</option>
          {rounds.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="code">Mã trận (tuỳ chọn)</Label>
        <Input id="code" name="code" placeholder="Ví dụ: PI3 — để trống sẽ là LIVE-1, LIVE-2…" className="mt-1" />
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-800">Giám khảo</legend>
        <p className="mt-1 text-xs text-slate-500">
          Cần ít nhất 1 người. Để chốt điểm trận, hệ thống đòi đủ {judgesPerMatch} phiếu đã nộp (cấu hình cuộc thi).
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {judges.map((judge) => (
            <label key={judge.id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              <input type="checkbox" name="judgeIds" value={judge.id} className="size-4" />
              {judge.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="setAsCurrent" defaultChecked className="size-4" />
        Đặt làm trận hiện tại (sân khấu / overlay)
      </label>
      <div>
        <Label htmlFor="challengeId">Đề thi từ kho (tuỳ chọn)</Label>
        <select id="challengeId" name="challengeId" className="mt-1 h-11 w-full rounded-xl border px-3">
          <option value="">— Không chọn / nhập đề mới bên dưới —</option>
          {challenges.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="problemTitle">Tiêu đề đề thi (cả hai đội)</Label>
        <Input id="problemTitle" name="problemTitle" placeholder="Bỏ trống nếu đã chọn từ kho" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="problemPrompt">Nội dung đề thi</Label>
        <Textarea id="problemPrompt" name="problemPrompt" className="mt-1" placeholder="Đề chung hiển thị trên sân khấu và overlay" />
      </div>
      <div>
        <Label htmlFor="match-reason">Lý do (audit)</Label>
        <Input id="match-reason" name="reason" required placeholder="Ví dụ: tứ kết 1 — cùng đề cho hai đội" className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Đang tạo…" : "Tạo trận và mở SCORING"}
      </Button>
      {pending ? <p className="text-sm text-slate-600">Đang lưu…</p> : null}
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
