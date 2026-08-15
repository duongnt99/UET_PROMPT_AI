export const LIVE_MATCH_STATUSES = [
  "CHECK_IN",
  "READY",
  "SPRINT",
  "PITCH",
  "SCORING",
  "VERDICT",
  "TIE_REVIEW",
  "NEEDS_VERDICT",
] as const;

export function normalizeMatchCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "-");
}

export function assertLiveMatchSetup(params: {
  competitorAId: string;
  competitorBId: string;
  judgeIds: string[];
  code?: string;
}) {
  if (!params.competitorAId || !params.competitorBId) {
    throw new Error("Cần chọn đủ hai finalist.");
  }
  if (params.competitorAId === params.competitorBId) {
    throw new Error("Hai bên trận đấu phải là hai finalist khác nhau.");
  }
  const judges = [...new Set(params.judgeIds.map((id) => id.trim()).filter(Boolean))];
  if (judges.length < 1) {
    throw new Error("Cần gán ít nhất một giám khảo.");
  }
  if (params.code) {
    const code = normalizeMatchCode(params.code);
    if (!/^[A-Z0-9-]{2,20}$/.test(code)) {
      throw new Error("Mã trận chỉ dùng chữ, số và dấu gạch ngang (2–20 ký tự).");
    }
  }
  return { judgeIds: judges, code: params.code ? normalizeMatchCode(params.code) : undefined };
}

export const PAIRING_LOCKED_STATUSES = ["COMPLETED", "PUBLISHED", "LOCKED"] as const;

export function assertCanChangePairing(params: { status: string; bracketLocked: boolean; submittedScoreCount: number }) {
  if (params.bracketLocked) {
    throw new Error("Trận đang khóa bracket. Không đổi cặp được.");
  }
  if ((PAIRING_LOCKED_STATUSES as readonly string[]).includes(params.status)) {
    throw new Error("Trận đã hoàn thành/khóa. Không đổi cặp được.");
  }
  if (params.submittedScoreCount > 0) {
    throw new Error("Đã có phiếu giám khảo nộp. Không đổi cặp được — hãy dừng trận và tạo trận mới.");
  }
}

export function formatTimerClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
