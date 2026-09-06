"use client";

import { useState } from "react";
import { loginAction, registerAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Card } from "@/components/ui/form";
import Link from "next/link";

function trimOnBlur(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.value = event.currentTarget.value.trim();
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
          setMessage(result.ok ? "Đã tạo tài khoản. Bạn có thể đăng nhập ngay." : result.message);
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
        <div>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={10}
            required
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={10}
            required
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        <Button type="submit" className="w-full">Đăng ký</Button>
      </form>
      <p className="mt-4 text-sm">
        Đã có tài khoản? <Link href="/dang-nhap" className="underline">Đăng nhập</Link>
      </p>
    </Card>
  );
}

export function LoginForm({ from = "" }: { from?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="display text-2xl">Đăng nhập</h1>
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
        <div>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1"
          />
        </div>
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <Button type="submit" className="w-full">Đăng nhập</Button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/quen-mat-khau" className="underline">Quên mật khẩu</Link>
      </p>
    </Card>
  );
}
