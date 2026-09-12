"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createRegistrationAction,
  inviteMemberAction,
  submitRegistrationAction,
} from "@/server/actions/participant-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { registrationStatusLabel } from "@/lib/status-labels";
import {
  canEditTeamRoster,
  teamSizeCountLabel,
  teamSizeRequirementLabel,
} from "@/lib/team-registration";
import { formatDateTime } from "@/lib/dates";

type TeamMember = {
  email: string;
  status: string;
  roleLabel: string | null;
};

export function RegistrationWizard({
  hasRegistration,
  status,
  mode,
  teamName,
  registrationCode,
  registrationType,
  submittedAt,
  teamMembers = [],
  teamMinSize,
  teamMaxSize,
  allowEditAfterSubmit,
}: {
  hasRegistration: boolean;
  status?: string;
  mode: string;
  teamName?: string;
  registrationCode?: string;
  registrationType?: "INDIVIDUAL" | "TEAM";
  submittedAt?: string | Date | null;
  teamMembers?: TeamMember[];
  teamMinSize: number;
  teamMaxSize: number;
  allowEditAfterSubmit: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitIdempotencyKey] = useState(() => crypto.randomUUID());
  const createGuardRef = useRef(false);

  const rosterEditable =
    status
      ? canEditTeamRoster({ status, allowEditAfterSubmit }).ok
      : true;
  const acceptedCount = teamMembers.filter((member) => member.status === "ACCEPTED").length;
  const atTeamMax = registrationType === "TEAM" && acceptedCount >= teamMaxSize;
  const teamSizeSettings = { minSize: teamMinSize, maxSize: teamMaxSize };

  const refreshAfterSuccess = () => {
    router.refresh();
  };

  if (mode === "UNDECIDED") {
    return <p>Hình thức đăng ký chưa được Ban Tổ chức chốt. Bạn chưa thể nộp hồ sơ.</p>;
  }

  if (!hasRegistration) {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (createGuardRef.current || pending) return;
          createGuardRef.current = true;
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            try {
              const result = await createRegistrationAction(formData);
              if (!result.ok) {
                setMessage(result.message ?? "Không tạo được hồ sơ.");
                return;
              }
              setMessage(null);
              refreshAfterSuccess();
            } finally {
              createGuardRef.current = false;
            }
          });
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
          <Input id="teamName" name="teamName" maxLength={120} className="mt-1" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang tạo…" : "Tạo hồ sơ"}
        </Button>
        {message ? <p className="text-sm text-red-700" role="status">{message}</p> : null}
      </form>
    );
  }

  const submitted = status === "SUBMITTED" || (!rosterEditable && status !== "DRAFT" && status !== "NEEDS_UPDATE");

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          Trạng thái hồ sơ: <span className="font-semibold text-slate-900">{registrationStatusLabel(status ?? "DRAFT")}</span>
        </p>
        {registrationCode ? (
          <p className="mt-1 text-sm text-slate-600">Mã hồ sơ: <span className="font-medium">{registrationCode}</span></p>
        ) : null}
        {submittedAt ? (
          <p className="mt-1 text-sm text-slate-600">Thời điểm nộp: {formatDateTime(submittedAt)}</p>
        ) : null}
        {submitted ? (
          <p className="mt-2 text-sm text-emerald-800">
            Hồ sơ đã được nộp và hiện đang khóa chỉnh sửa. Bạn có thể xem biên nhận tại{" "}
            <Link href="/dashboard/bien-nhan" className="underline">Biên nhận</Link>.
          </p>
        ) : null}
      </div>

      {registrationType === "TEAM" && teamName ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Đội — {teamName}</h2>
          <p className="text-sm text-slate-600">{teamSizeRequirementLabel(teamSizeSettings)}</p>
          <p className="text-sm font-medium text-slate-800">{teamSizeCountLabel(acceptedCount, teamSizeSettings)}</p>
          <ul className="space-y-1 rounded-xl border bg-white p-4 text-sm">
            {teamMembers.map((member) => (
              <li key={`${member.email}-${member.status}`}>
                {member.email}
                {member.roleLabel ? ` · ${member.roleLabel}` : ""}
                {" · "}
                {member.status === "ACCEPTED" ? "Đã tham gia" : member.status}
              </li>
            ))}
          </ul>
          {rosterEditable ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (pending || atTeamMax) return;
                const formData = new FormData(event.currentTarget);
                startTransition(async () => {
                  const result = await inviteMemberAction(formData);
                  setFeedback(result.message ?? (result.ok ? "Đã gửi lời mời trong hệ thống." : "Lỗi"));
                  if (result.ok) refreshAfterSuccess();
                });
              }}
            >
              <Label htmlFor="invite-email">Mời thành viên</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="email thành viên"
                required
                disabled={atTeamMax}
                className="mt-1"
              />
              <Button type="submit" variant="outline" disabled={pending || atTeamMax}>
                {pending ? "Đang gửi…" : atTeamMax ? "Đã đạt sĩ số tối đa" : "Mời trong hệ thống"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-slate-600">Danh sách thành viên hiện chỉ xem.</p>
          )}
        </section>
      ) : null}

      {rosterEditable ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) return;
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await submitRegistrationAction(formData);
              if ("ok" in result && result.ok) {
                setMessage(`Đã nộp. Mã hồ sơ: ${result.code}`);
                refreshAfterSuccess();
                return;
              }
              setMessage("message" in result ? result.message ?? "Lỗi" : "Lỗi");
            });
          }}
        >
          <input type="hidden" name="idempotencyKey" value={submitIdempotencyKey} />
          <h2 className="font-semibold">Nộp hồ sơ</h2>
          {registrationType === "TEAM" ? (
            <p className="text-sm text-slate-600">
              Cần tối thiểu {teamMinSize} thành viên đã tham gia và mỗi thành viên phải hoàn tất hồ sơ (họ tên,
              trường, mã sinh viên) trước khi nộp.
            </p>
          ) : null}
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="consentToRules" required /> Đồng ý thể lệ
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="consentToDataProcessing" required /> Đồng ý xử lý dữ liệu
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="consentToPublicFinalistProfile" /> Đồng ý công khai hồ sơ finalist không thiết yếu
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Đang nộp…" : "Nộp hồ sơ"}
          </Button>
        </form>
      ) : null}

      {feedback ? <p className="text-sm text-emerald-700" role="status">{feedback}</p> : null}
      {message ? (
        <p className={`text-sm ${message.startsWith("Đã nộp") ? "text-emerald-700" : "text-red-700"}`} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
