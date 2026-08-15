export type RegistrationMode = "INDIVIDUAL" | "TEAM" | "BOTH" | "UNDECIDED";
export type RegistrationType = "INDIVIDUAL" | "TEAM";

export const ACTIVE_REGISTRATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "NEEDS_UPDATE",
  "ELIGIBLE",
  "INELIGIBLE",
  "UNDER_REVIEW",
  "SELECTED",
  "NOT_SELECTED",
  "LOCKED",
] as const;

export type ActiveRegistrationStatus = (typeof ACTIVE_REGISTRATION_STATUSES)[number];

export function canSubmitRegistration(mode: RegistrationMode): {
  ok: boolean;
  message?: string;
} {
  if (mode === "UNDECIDED") {
    return {
      ok: false,
      message:
        "Hình thức đăng ký chưa được Ban Tổ chức chốt. Bạn có thể lưu nháp nhưng chưa thể nộp hồ sơ.",
    };
  }
  return { ok: true };
}

export function isRegistrationTypeAllowed(
  mode: RegistrationMode,
  type: RegistrationType,
): boolean {
  if (mode === "UNDECIDED") return false;
  if (mode === "BOTH") return true;
  return mode === type;
}

export function assertSingleActiveRegistration(params: {
  existingActiveCount: number;
}): { ok: boolean; message?: string } {
  if (params.existingActiveCount > 0) {
    return {
      ok: false,
      message: "Mỗi người chỉ được thuộc một hồ sơ đăng ký đang hiệu lực trong cuộc thi.",
    };
  }
  return { ok: true };
}

export function canEditRegistration(params: {
  status: string;
  allowEditAfterSubmit: boolean;
  deadlinePassed: boolean;
  hasOverride: boolean;
}): boolean {
  if (params.status === "LOCKED" || params.status === "WITHDRAWN") return false;
  if (params.status === "DRAFT" || params.status === "NEEDS_UPDATE") {
    return !params.deadlinePassed || params.hasOverride;
  }
  if (params.allowEditAfterSubmit && params.status === "SUBMITTED") {
    return !params.deadlinePassed || params.hasOverride;
  }
  return false;
}
