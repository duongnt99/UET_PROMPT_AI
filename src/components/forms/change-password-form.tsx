"use client";

import { useState } from "react";
import { changePasswordAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/form";
import { PasswordField } from "@/components/forms/password-fields";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Đang lưu…" : "Đổi mật khẩu"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <Card className="mt-8 max-w-xl">
      <h2 className="display text-xl">Đổi mật khẩu</h2>
      <p className="mt-2 text-sm text-slate-700">
        Cập nhật mật khẩu đăng nhập. Nếu quên mật khẩu, dùng{" "}
        <a href="/quen-mat-khau" className="underline">Quên mật khẩu</a> để nhận liên kết qua email.
      </p>
      <form
        className="mt-5 space-y-4"
        action={async (formData) => {
          const result = await changePasswordAction(formData);
          setSuccess(result.ok);
          setMessage(result.message ?? (result.ok ? "Đã đổi mật khẩu." : "Không đổi được mật khẩu."));
        }}
      >
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
        />
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
        {message ? (
          <p className={`text-sm ${success ? "text-emerald-700" : "text-red-700"}`}>{message}</p>
        ) : null}
        <SubmitButton />
      </form>
    </Card>
  );
}
