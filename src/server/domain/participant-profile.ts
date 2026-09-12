export type ParticipantProfileFields = {
  fullName?: string | null;
  institution?: string | null;
  studentId?: string | null;
};

export function isParticipantProfileComplete(profile: ParticipantProfileFields | null | undefined): boolean {
  return Boolean(
    profile?.fullName?.trim() && profile?.institution?.trim() && profile?.studentId?.trim(),
  );
}

export function missingParticipantProfileFields(profile: ParticipantProfileFields | null | undefined): string[] {
  const missing: string[] = [];
  if (!profile?.fullName?.trim()) missing.push("họ tên");
  if (!profile?.institution?.trim()) missing.push("trường");
  if (!profile?.studentId?.trim()) missing.push("mã sinh viên");
  return missing;
}
