"use client";

import { useState } from "react";
import Link from "next/link";
import { resendVerificationAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { useFormStatus } from "react-dom";

function trimOnBlur(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.trim();
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Đang gửi…" : "Gửi lại email xác minh"}
    </Button>
  );
}

export function ResendVerificationForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <form
      className="mt-6 space-y-4"
      action={async (formData) => {
        const result = await resendVerificationAction(formData);
        setSuccess(result.ok);
        setMessage(result.message ?? "");
      }}
    >
      <div>
        <Label htmlFor="email">Email đăng ký</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1"
          onBlur={trimOnBlur}
        />
      </div>
      {message ? (
        <p className={`text-sm ${success ? "text-emerald-700" : "text-red-700"}`}>{message}</p>
      ) : null}
      <SubmitButton />
      <p className="text-sm">
        <Link href="/dang-nhap" className="underline">Quay lại đăng nhập</Link>
      </p>
    </form>
  );
}
