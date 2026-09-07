"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { retryAdminEmailBatchAction } from "@/server/actions/admin-email-actions";

export function EmailRetryButton({ batchId }: { batchId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <div><Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const data = new FormData(); data.set("batchId", batchId); const result = await retryAdminEmailBatchAction(data); setMessage(result.message); })}>{pending ? "Đang xử lý…" : "Gửi lại email lỗi"}</Button>{message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}</div>;
}
