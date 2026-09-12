"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Card } from "@/components/ui/form";
import { useFormStatus } from "react-dom";

function trimOnBlur(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.trim();
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="display text-2xl">Quên mật khẩu</h1>
      <p className="mt-3 text-sm text-slate-700">
        Nhập email đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu nếu email tồn tại trong hệ thống.
      </p>
      <form
        className="mt-6 space-y-4"
        action={async (formData) => {
          const result = await forgotPasswordAction(formData);
          setSuccess(result.ok);
          setMessage(result.message ?? (result.ok ? "Đã gửi yêu cầu." : "Không gửi được yêu cầu."));
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
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
      </form>
      <p className="mt-4 text-sm">
        <Link href="/dang-nhap" className="underline">Quay lại đăng nhập</Link>
      </p>
    </Card>
  );
}
