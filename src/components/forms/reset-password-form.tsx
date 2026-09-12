"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/form";
import { PasswordField } from "@/components/forms/password-fields";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Đang lưu…" : "Đặt mật khẩu mới"}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="display text-2xl">Đặt lại mật khẩu</h1>
      <p className="mt-3 text-sm text-slate-700">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      <form
        className="mt-6 space-y-4"
        action={async (formData) => {
          const result = await resetPasswordAction(formData);
          if (result && "message" in result) setMessage(result.message ?? "Không đặt lại được mật khẩu.");
        }}
      >
        <input type="hidden" name="token" value={token} />
        <PasswordField
          id="password"
          name="password"
          label="Mật khẩu mới"
          autoComplete="new-password"
          minLength={10}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          autoComplete="new-password"
          minLength={10}
        />
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <SubmitButton />
      </form>
      <p className="mt-4 text-sm">
        <Link href="/dang-nhap" className="underline">Quay lại đăng nhập</Link>
      </p>
    </Card>
  );
}
