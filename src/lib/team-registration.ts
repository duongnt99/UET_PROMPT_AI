export type TeamSizeSettings = {
  minSize: number;
  maxSize: number;
};

export const ROSTER_EDITABLE_STATUSES = ["DRAFT", "NEEDS_UPDATE"] as const;

export function canEditTeamRoster(params: {
  status: string;
  allowEditAfterSubmit: boolean;
}): { ok: boolean; message?: string } {
  if ((ROSTER_EDITABLE_STATUSES as readonly string[]).includes(params.status)) {
    return { ok: true };
  }
  if (params.allowEditAfterSubmit && params.status === "SUBMITTED") {
    return { ok: true };
  }
  return {
    ok: false,
    message: "Hồ sơ đã nộp. Danh sách thành viên hiện chỉ xem, không chỉnh sửa.",
  };
}

export function teamSizeRequirementLabel(settings: TeamSizeSettings): string {
  return `Đội từ ${settings.minSize} đến ${settings.maxSize} thành viên (bao gồm nhóm trưởng).`;
}

export function teamSizeCountLabel(acceptedCount: number, settings: TeamSizeSettings): string {
  return `${acceptedCount}/${settings.maxSize} thành viên`;
}
