import type { Role } from "@/server/domain/permissions";

export const LIVE_SCREEN_MATCH_STATUSES = ["CHECK_IN", "READY", "SPRINT", "PITCH", "SCORING"] as const;

export function isLiveScreenMatchStatus(status: string): boolean {
  return (LIVE_SCREEN_MATCH_STATUSES as readonly string[]).includes(status);
}

export function assertCanWatchLiveScreen(roles: Role[]): void {
  if (!roles.some((role) => ["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"].includes(role))) {
    throw new Error("Bạn không có quyền xem màn hình của đội thi.");
  }
}

export function assertCanPublishLiveScreen(params: {
  authenticatedUserId: string;
  requestedParticipantId?: string;
  isEligibleCompetitor: boolean;
  isCurrentContestSession: boolean;
  matchStatus: string;
}): void {
  if (params.requestedParticipantId && params.requestedParticipantId !== params.authenticatedUserId) {
    throw new Error("Danh tính người chia sẻ không hợp lệ.");
  }
  if (!params.isEligibleCompetitor) {
    throw new Error("Bạn không thuộc đội hoặc hồ sơ dự thi này.");
  }
  if (!params.isCurrentContestSession || !isLiveScreenMatchStatus(params.matchStatus)) {
    throw new Error("Thí sinh hiện không trong thời gian được phép chia sẻ màn hình.");
  }
}

export function chooseAvailableScreenSlot(activeSlots: number[]): 1 | 2 {
  if (!activeSlots.includes(1)) return 1;
  if (!activeSlots.includes(2)) return 2;
  throw new Error("Đội đã sử dụng đủ 2 luồng chia sẻ màn hình.");
}

export function assertRegistrationBelongsToContestSession(params: {
  requestedRegistrationId: string;
  competitorRegistrationIds: Array<string | null | undefined>;
}): void {
  if (!params.competitorRegistrationIds.includes(params.requestedRegistrationId)) {
    throw new Error("Hồ sơ dự thi không thuộc phiên thi này.");
  }
}
