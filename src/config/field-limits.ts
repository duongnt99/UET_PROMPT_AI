export const FIELD_LIMITS = {
  PROBLEM_TITLE: 200,
  PROBLEM_PROMPT: 8000,
  CHALLENGE_NOTES: 2000,
  AUDIT_REASON: 500,
  MATCH_CODE: 64,
  PROFILE_FULL_NAME: 120,
  PROFILE_PHONE: 20,
  PROFILE_INSTITUTION: 200,
  PROFILE_FACULTY: 200,
  PROFILE_MAJOR: 120,
  PROFILE_STUDENT_ID: 32,
  PROFILE_ACADEMIC_YEAR: 20,
  PROFILE_PROVINCE: 100,
  PROFILE_SHORT_BIO: 500,
} as const;

export type ProfileInput = {
  fullName: string;
  phoneNumber?: string;
  institution?: string;
  facultyOrDepartment?: string;
  major?: string;
  studentId?: string;
  academicYear?: string;
  provinceOrCity?: string;
  shortBio?: string;
};

function limitProfileText(value: string, max: number, label: string, required = false) {
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new Error(`${label} không được để trống.`);
    return "";
  }
  if (trimmed.length > max) {
    throw new Error(`${label} tối đa ${max} ký tự.`);
  }
  return trimmed;
}

export function normalizeProfileData(data: ProfileInput): ProfileInput {
  return {
    fullName: limitProfileText(data.fullName, FIELD_LIMITS.PROFILE_FULL_NAME, "Họ và tên", true),
    phoneNumber: limitProfileText(data.phoneNumber ?? "", FIELD_LIMITS.PROFILE_PHONE, "Số điện thoại"),
    institution: limitProfileText(data.institution ?? "", FIELD_LIMITS.PROFILE_INSTITUTION, "Trường"),
    facultyOrDepartment: limitProfileText(
      data.facultyOrDepartment ?? "",
      FIELD_LIMITS.PROFILE_FACULTY,
      "Khoa/đơn vị",
    ),
    major: limitProfileText(data.major ?? "", FIELD_LIMITS.PROFILE_MAJOR, "Ngành"),
    studentId: limitProfileText(data.studentId ?? "", FIELD_LIMITS.PROFILE_STUDENT_ID, "Mã sinh viên"),
    academicYear: limitProfileText(data.academicYear ?? "", FIELD_LIMITS.PROFILE_ACADEMIC_YEAR, "Khóa"),
    provinceOrCity: limitProfileText(data.provinceOrCity ?? "", FIELD_LIMITS.PROFILE_PROVINCE, "Tỉnh/thành"),
    shortBio: limitProfileText(data.shortBio ?? "", FIELD_LIMITS.PROFILE_SHORT_BIO, "Giới thiệu ngắn"),
  };
}

export function normalizeAuditReason(reason: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 3) throw new Error("Cần ghi lý do (audit).");
  if (trimmed.length > FIELD_LIMITS.AUDIT_REASON) {
    throw new Error(`Lý do tối đa ${FIELD_LIMITS.AUDIT_REASON} ký tự.`);
  }
  return trimmed;
}

export function normalizeChallengeNotes(notes: string) {
  const trimmed = notes.trim();
  if (trimmed.length > FIELD_LIMITS.CHALLENGE_NOTES) {
    throw new Error(`Ghi chú tối đa ${FIELD_LIMITS.CHALLENGE_NOTES} ký tự.`);
  }
  return trimmed;
}
