"use client";

import { useState } from "react";
import {
  createRegistrationAction,
  inviteMemberAction,
  submitRegistrationAction,
} from "@/server/actions/participant-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

export function RegistrationWizard({
  hasRegistration,
  status,
  mode,
  teamName,
}: {
  hasRegistration: boolean;
  status?: string;
  mode: string;
  teamName?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  if (mode === "UNDECIDED") {
    return <p>Hình thức đăng ký chưa được Ban Tổ chức chốt. Bạn chưa thể nộp hồ sơ.</p>;
  }
  if (!hasRegistration) {
    return (
      <form
        className="space-y-4"
        action={async (formData) => {
          const result = await createRegistrationAction(formData);
          setMessage(result.ok ? "Đã tạo hồ sơ nháp." : result.message ?? "Lỗi");
        }}
      >
        <div>
          <Label htmlFor="type">Hình thức</Label>
          <select id="type" name="type" className="mt-1 h-11 w-full rounded-xl border px-3">
            {(mode === "INDIVIDUAL" || mode === "BOTH") && <option value="INDIVIDUAL">Cá nhân</option>}
            {(mode === "TEAM" || mode === "BOTH") && <option value="TEAM">Đội</option>}
          </select>
        </div>
        <div>
          <Label htmlFor="teamName">Tên đội (nếu thi đội)</Label>
          <Input id="teamName" name="teamName" className="mt-1" />
        </div>
        <Button type="submit">Tạo hồ sơ</Button>
        {message ? <p>{message}</p> : null}
      </form>
    );
  }
  return (
    <div className="space-y-8">
      <p>Trạng thái hiện tại: {status}</p>
      {teamName ? (
        <form
          className="space-y-3"
          action={async (formData) => {
            const result = await inviteMemberAction(formData);
            setSaved(result.message ?? (result.ok ? "Đã gửi lời mời trong hệ thống." : "Lỗi"));
          }}
        >
          <h2 className="font-semibold">Mời thành viên — {teamName}</h2>
          <Input name="email" type="email" placeholder="email thành viên" required />
          <Button type="submit" variant="outline">Mời trong hệ thống</Button>
        </form>
      ) : null}
      <form
        className="space-y-3"
        action={async (formData) => {
          const result = await submitRegistrationAction(formData);
          setMessage("ok" in result && result.ok ? `Đã nộp. Mã hồ sơ: ${result.code}` : "message" in result ? result.message ?? "Lỗi" : "Lỗi");
        }}
      >
        <input type="hidden" name="idempotencyKey" value={crypto.randomUUID()} />
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="consentToRules" /> Đồng ý thể lệ
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="consentToDataProcessing" /> Đồng ý xử lý dữ liệu
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="consentToPublicFinalistProfile" /> Đồng ý công khai hồ sơ finalist không thiết yếu
        </label>
        <Button type="submit">Nộp hồ sơ</Button>
      </form>
      {saved ? <p className="text-sm text-emerald-700">{saved}</p> : null}
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
