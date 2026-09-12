"use client";

import { useState } from "react";
import { loginAction, registerAction } from "@/server/actions/auth-actions";
import { PasswordField } from "@/components/forms/password-fields";
import { Button } from "@/components/ui/button";
import { Input, Label, Card } from "@/components/ui/form";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function trimOnBlur(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.trim();
}

function AuthSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? pendingLabel : label}</Button>;
}

export function RegisterForm() {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="display text-2xl">Tạo tài khoản</h1>
      <form
        className="mt-6 space-y-4"
        action={async (formData) => {
          const result = await registerAction(formData);
          setMessage(result.message);
        }}
      >
        <div>
          <Label htmlFor="email">Tên đăng nhập (email)</Label>
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
        <PasswordField
          id="password"
          name="password"
          label="Mật khẩu"
          autoComplete="new-password"
          minLength={10}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          minLength={10}
        />
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <AuthSubmitButton label="Đăng ký" pendingLabel="Đang đăng ký…" />
      </form>
      <p className="mt-4 text-sm">
        Đã có tài khoản? <Link href="/dang-nhap" className="underline">Đăng nhập</Link>
      </p>
    </Card>
  );
}

export function LoginForm({
  from = "",
  registered = false,
  reset = false,
}: {
  from?: string;
  registered?: boolean;
  reset?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="display text-2xl">Đăng nhập</h1>
      {registered ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã tạo tài khoản thành công. Vui lòng xác minh email trước khi đăng nhập.
        </p>
      ) : null}
      {reset ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.
        </p>
      ) : null}
      <form
        className="mt-6 space-y-4"
        action={async (formData) => {
          const result = await loginAction(formData);
          if (result && "ok" in result && !result.ok) setMessage(result.message ?? "Đăng nhập thất bại.");
        }}
      >
        <input type="hidden" name="from" value={from} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1"
            onBlur={trimOnBlur}
          />
        </div>
        <PasswordField
          id="password"
          name="password"
          label="Mật khẩu"
          autoComplete="current-password"
        />
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <AuthSubmitButton label="Đăng nhập" pendingLabel="Đang đăng nhập…" />
      </form>
      <p className="mt-4 text-sm">
        <Link href="/quen-mat-khau" className="underline">Quên mật khẩu</Link>
      </p>
    </Card>
  );
}
