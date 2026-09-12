"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  acceptTeamInvitationAction,
  declineTeamInvitationAction,
} from "@/server/actions/participant-actions";

export function TeamInvitationActions({
  invitationId,
  hasRegistrationConflict,
}: {
  invitationId: string;
  hasRegistrationConflict: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-3">
      {hasRegistrationConflict ? (
        <p className="mb-3 text-sm text-amber-700">
          Bạn đã thuộc một hồ sơ khác trong cuộc thi này nên không thể chấp nhận lời mời này.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!hasRegistrationConflict ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (pending) return;
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                const result = await acceptTeamInvitationAction(formData);
                setMessage(result.message ?? null);
                if (result.ok) router.refresh();
              });
            }}
          >
            <input type="hidden" name="invitationId" value={invitationId} />
            <Button type="submit" disabled={pending}>{pending ? "Đang xử lý…" : "Chấp nhận"}</Button>
          </form>
        ) : null}
        <form
          action={async (formData) => {
            const result = await declineTeamInvitationAction(formData);
            setMessage(result.message);
          }}
        >
          <input type="hidden" name="invitationId" value={invitationId} />
          <Button type="submit" variant="outline">Từ chối</Button>
        </form>
      </div>
      {message ? <p className="mt-2 text-sm" role="status">{message}</p> : null}
    </div>
  );
}
