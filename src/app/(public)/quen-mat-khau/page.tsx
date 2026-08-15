import { ForgotForm } from "@/components/forms/auth-forms";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Quên mật khẩu" };
export default function Page() {
  return (
    <div className="px-4 py-16">
      <ForgotForm />
    </div>
  );
}
