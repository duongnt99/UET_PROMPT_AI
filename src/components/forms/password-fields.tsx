"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, Label } from "@/components/ui/form";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          minLength={minLength}
          required
          autoComplete={autoComplete}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
