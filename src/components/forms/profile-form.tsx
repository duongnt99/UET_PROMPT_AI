"use client";

import { useState } from "react";
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

export function ProfileForm({ profile }: { profile: Profile }) {
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      action={async (formData) => {
        const result = await saveProfileAction(formData);
        if (result.ok) setSaved("Đã lưu");
      }}
    >
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
        <Button type="submit">Lưu hồ sơ</Button>
        {saved ? <span className="text-sm text-emerald-700">{saved}</span> : null}
      </div>
    </form>
  );
}
