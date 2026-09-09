"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction } from "@/server/actions/participant-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";

type Profile = {
  fullName: string;
  phoneNumber?: string | null;
  institution?: string | null;
  facultyOrDepartment?: string | null;
  major?: string | null;
  studentId?: string | null;
  academicYear?: string | null;
  provinceOrCity?: string | null;
  shortBio?: string | null;
};

type ProfileActionState = { ok: boolean; message: string };

const idle: ProfileActionState = { ok: false, message: "" };

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const refreshedFor = useRef("");
  const [state, action, pending] = useActionState(
    async (_prev: ProfileActionState, formData: FormData): Promise<ProfileActionState> => {
      const result = await saveProfileAction(formData);
      if (result.ok) return { ok: true, message: "Đã lưu" };
      return { ok: false, message: result.message ?? "Không lưu được." };
    },
    idle,
  );

  useEffect(() => {
    if (!state.ok || !state.message || pending) return;
    if (refreshedFor.current === state.message) return;
    refreshedFor.current = state.message;
    router.refresh();
  }, [state.ok, state.message, pending, router]);

  return (
    <form className="grid gap-4 md:grid-cols-2" action={action}>
      {[
        ["fullName", "Họ và tên", profile.fullName],
        ["phoneNumber", "Số điện thoại", profile.phoneNumber ?? ""],
        ["institution", "Trường", profile.institution ?? ""],
        ["facultyOrDepartment", "Khoa/đơn vị", profile.facultyOrDepartment ?? ""],
        ["major", "Ngành", profile.major ?? ""],
        ["studentId", "Mã sinh viên", profile.studentId ?? ""],
        ["academicYear", "Khóa", profile.academicYear ?? ""],
        ["provinceOrCity", "Tỉnh/thành", profile.provinceOrCity ?? ""],
      ].map(([name, label, value]) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} defaultValue={value} className="mt-1" />
        </div>
      ))}
      <div className="md:col-span-2">
        <Label htmlFor="shortBio">Giới thiệu ngắn</Label>
        <Textarea id="shortBio" name="shortBio" defaultValue={profile.shortBio ?? ""} className="mt-1" />
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu hồ sơ"}</Button>
        {state.message ? (
          <span className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
