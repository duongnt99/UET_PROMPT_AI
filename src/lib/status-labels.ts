const MATCH_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  CHECK_IN: "Đang điểm danh",
  READY: "Sẵn sàng",
  SPRINT: "Đang thi thực hành",
  PITCH: "Đang thuyết trình",
  SCORING: "Đang chấm điểm",
  VERDICT: "Đang quyết định kết quả",
  TIE_REVIEW: "Đang xử lý hòa",
  NEEDS_VERDICT: "Cần quyết định",
  LOCKED: "Đã khóa",
  PUBLISHED: "Đã công bố",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang chấm",
  SUBMITTED: "Đã nộp",
  DECLINED: "Đã từ chối",
  REOPENED: "Đã mở lại",
  LOCKED: "Đã khóa",
};

const TIMER_KIND_LABELS: Record<string, string> = {
  SPRINT: "Phần thi thực hành",
  PITCH: "Phần thuyết trình",
  VERDICT: "Phần công bố kết quả",
};

const TIMER_STATUS_LABELS: Record<string, string> = {
  IDLE: "Chưa chạy",
  RUNNING: "Đang chạy",
  PAUSED: "Tạm dừng",
  COMPLETED: "Đã hết giờ",
};

const CONTENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Hẹn đăng",
  PUBLISHED: "Đã đăng",
  ARCHIVED: "Lưu trữ",
};

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Đã nộp",
  NEEDS_UPDATE: "Cần bổ sung",
  ELIGIBLE: "Đủ điều kiện",
  INELIGIBLE: "Không đủ điều kiện",
  UNDER_REVIEW: "Đang xét duyệt",
  SELECTED: "Được chọn vào chung kết",
  NOT_SELECTED: "Không được chọn",
  WITHDRAWN: "Đã rút",
  LOCKED: "Đã khóa",
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  PENDING_VERIFICATION: "Chờ kích hoạt",
  DISABLED: "Đã vô hiệu hóa",
};

const RUBRIC_STAGE_LABELS: Record<string, string> = {
  AUDITION: "Vòng tuyển chọn",
  FINAL: "Vòng chung kết",
};

export function matchStatusLabel(status: string) {
  return MATCH_STATUS_LABELS[status] ?? status;
}

export function reviewStatusLabel(status: string) {
  return REVIEW_STATUS_LABELS[status] ?? status;
}

export function timerKindLabel(kind: string) {
  return TIMER_KIND_LABELS[kind] ?? kind;
}

export function timerStatusLabel(status: string) {
  return TIMER_STATUS_LABELS[status] ?? status;
}

export function contentStatusLabel(status: string) {
  return CONTENT_STATUS_LABELS[status] ?? status;
}

export function registrationStatusLabel(status: string) {
  return REGISTRATION_STATUS_LABELS[status] ?? status;
}

export function accountStatusLabel(status: string) {
  return ACCOUNT_STATUS_LABELS[status] ?? status;
}

export function rubricStageLabel(stage: string) {
  return RUBRIC_STAGE_LABELS[stage] ?? stage;
}
