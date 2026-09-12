"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAction } from "@/server/actions/participant-actions";
import { FIELD_LIMITS } from "@/config/field-limits";
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

const PROFILE_FIELDS: Array<{
  name: keyof Profile;
  label: string;
  maxLength: number;
  required?: boolean;
}> = [
  { name: "fullName", label: "Họ và tên", maxLength: FIELD_LIMITS.PROFILE_FULL_NAME, required: true },
  { name: "phoneNumber", label: "Số điện thoại", maxLength: FIELD_LIMITS.PROFILE_PHONE },
  { name: "institution", label: "Trường", maxLength: FIELD_LIMITS.PROFILE_INSTITUTION },
  { name: "facultyOrDepartment", label: "Khoa/đơn vị", maxLength: FIELD_LIMITS.PROFILE_FACULTY },
  { name: "major", label: "Ngành", maxLength: FIELD_LIMITS.PROFILE_MAJOR },
  { name: "studentId", label: "Mã sinh viên", maxLength: FIELD_LIMITS.PROFILE_STUDENT_ID },
  { name: "academicYear", label: "Khóa", maxLength: FIELD_LIMITS.PROFILE_ACADEMIC_YEAR },
  { name: "provinceOrCity", label: "Tỉnh/thành", maxLength: FIELD_LIMITS.PROFILE_PROVINCE },
];

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
      {PROFILE_FIELDS.map(({ name, label, maxLength, required }) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            defaultValue={profile[name] ?? ""}
            maxLength={maxLength}
            required={required}
            className="mt-1"
          />
        </div>
      ))}
      <div className="md:col-span-2">
        <Label htmlFor="shortBio">Giới thiệu ngắn</Label>
        <Textarea
          id="shortBio"
          name="shortBio"
          defaultValue={profile.shortBio ?? ""}
          maxLength={FIELD_LIMITS.PROFILE_SHORT_BIO}
          className="mt-1 min-h-28"
        />
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
