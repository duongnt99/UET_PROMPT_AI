"use client";

import { useMemo, useState, useTransition } from "react";
import { sendAdminEmailAction, type EmailActionState } from "@/server/actions/admin-email-actions";
import { Button } from "@/components/ui/button";
import { Card, Input, Label, Textarea } from "@/components/ui/form";

type UserOption = { id: string; name: string | null; email: string };
type RecipientType = "ALL_USERS" | "ALL_PARTICIPANTS" | "SPECIFIC_USERS";

export function EmailComposeForm({
  users,
  allUsersCount,
  participantCount,
  initialIdempotencyKey,
}: {
  users: UserOption[];
  allUsersCount: number;
  participantCount: number;
  initialIdempotencyKey: string;
}) {
  const [recipientType, setRecipientType] = useState<RecipientType>("ALL_PARTICIPANTS");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<EmailActionState | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(initialIdempotencyKey);
  const [pending, startTransition] = useTransition();
  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => !normalized || `${user.name ?? ""} ${user.email}`.toLowerCase().includes(normalized));
  }, [query, users]);
  const recipientCount =
    recipientType === "ALL_USERS" ? allUsersCount : recipientType === "ALL_PARTICIPANTS" ? participantCount : selected.length;

  function submit() {
    const data = new FormData();
    data.set("recipientType", recipientType);
    data.set("subject", subject);
    data.set("content", content);
    data.set("idempotencyKey", idempotencyKey);
    selected.forEach((id) => data.append("userIds", id));
    startTransition(async () => {
      const result = await sendAdminEmailAction(data);
      setState(result);
      setConfirming(false);
      if (result.ok) {
        setSubject("");
        setContent("");
        setSelected([]);
        setIdempotencyKey(crypto.randomUUID());
      }
    });
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">Soạn thông báo</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <Label htmlFor="recipientType">Đối tượng nhận</Label>
          <select
            id="recipientType"
            value={recipientType}
            onChange={(event) => setRecipientType(event.target.value as RecipientType)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="ALL_PARTICIPANTS">Tất cả thí sinh</option>
            <option value="ALL_USERS">Tất cả người dùng</option>
            <option value="SPECIFIC_USERS">Người dùng cụ thể</option>
          </select>
          <p className="mt-2 text-sm text-slate-600">Số người nhận dự kiến: <strong>{recipientCount}</strong></p>
          {recipientType === "SPECIFIC_USERS" ? (
            <div className="mt-4">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc email" />
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2">
                {filteredUsers.map((user) => (
                  <label key={user.id} className="flex cursor-pointer gap-3 rounded-lg p-2 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(user.id)}
                      onChange={(event) => setSelected((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))}
                    />
                    <span><strong>{user.name || "Chưa cập nhật tên"}</strong><br /><span className="text-slate-600">{user.email}</span></span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-4">
          <div><Label htmlFor="emailSubject">Tiêu đề email</Label><Input id="emailSubject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={180} className="mt-1" /></div>
          <div><Label htmlFor="emailContent">Nội dung</Label><Textarea id="emailContent" value={content} onChange={(event) => setContent(event.target.value)} maxLength={20000} rows={9} className="mt-1 whitespace-pre-wrap" /></div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => setConfirming(true)} disabled={pending || !subject.trim() || !content.trim() || recipientCount === 0}>Xem trước và xác nhận</Button>
      </div>
      {confirming ? (
        <div role="dialog" aria-modal="true" className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
          <h3 className="font-semibold">Xác nhận gửi email</h3>
          <p className="mt-2 text-sm">Bạn sắp gửi email tới <strong>{recipientCount} người dùng</strong>. Thao tác sẽ được lưu vào lịch sử.</p>
          <p className="mt-4 font-semibold">{subject}</p>
          <div className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-sm">{content}</div>
          <div className="mt-4 flex gap-3"><Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={pending}>Hủy</Button><Button type="button" onClick={submit} disabled={pending}>{pending ? "Đang tạo đợt gửi…" : "Xác nhận gửi"}</Button></div>
        </div>
      ) : null}
      {state ? <p className={`mt-4 text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
    </Card>
  );
}
