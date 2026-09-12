import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return (
    <div className="px-4 py-16">
      <ForgotPasswordForm />
    </div>
  );
}
