export const REGISTRATION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["NEEDS_UPDATE", "UNDER_REVIEW", "ELIGIBLE", "INELIGIBLE", "WITHDRAWN", "LOCKED"],
  NEEDS_UPDATE: ["SUBMITTED", "WITHDRAWN"],
  UNDER_REVIEW: ["ELIGIBLE", "INELIGIBLE", "SELECTED", "NOT_SELECTED", "NEEDS_UPDATE"],
  ELIGIBLE: ["SELECTED", "NOT_SELECTED", "UNDER_REVIEW", "LOCKED"],
  INELIGIBLE: ["NEEDS_UPDATE", "ELIGIBLE"],
  SELECTED: ["LOCKED", "NOT_SELECTED"],
  NOT_SELECTED: ["SELECTED", "ELIGIBLE"],
  WITHDRAWN: [],
  LOCKED: [],
};

export const MATCH_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SCHEDULED", "READY", "SCORING", "CANCELLED"],
  SCHEDULED: ["DRAFT", "CHECK_IN", "READY", "SCORING", "CANCELLED"],
  CHECK_IN: ["READY", "SCHEDULED", "CANCELLED"],
  READY: ["SPRINT", "PITCH", "SCORING", "SCHEDULED", "CANCELLED"],
  SPRINT: ["PITCH", "SCORING", "READY", "CANCELLED"],
  PITCH: ["SCORING", "VERDICT", "SPRINT", "CANCELLED"],
  SCORING: ["VERDICT", "PITCH", "READY", "TIE_REVIEW", "NEEDS_VERDICT", "COMPLETED", "CANCELLED"],
  VERDICT: ["COMPLETED", "SCORING", "TIE_REVIEW", "NEEDS_VERDICT", "CANCELLED"],
  TIE_REVIEW: ["NEEDS_VERDICT", "VERDICT", "SCORING", "COMPLETED", "CANCELLED"],
  NEEDS_VERDICT: ["VERDICT", "COMPLETED", "SCORING", "CANCELLED"],
  LOCKED: [],
  PUBLISHED: [],
  COMPLETED: ["SCORING"],
  CANCELLED: ["DRAFT", "SCHEDULED", "READY", "SCORING"],
};

export const SUBMISSION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["LOCKED", "UNDER_REVIEW", "NEEDS_UPDATE", "WITHDRAWN"],
  UNDER_REVIEW: ["SCORED", "NEEDS_UPDATE", "LOCKED"],
  SCORED: ["LOCKED", "NEEDS_UPDATE"],
  NEEDS_UPDATE: ["SUBMITTED", "DRAFT"],
  LOCKED: [],
  WITHDRAWN: [],
};

export function canTransition(map: Record<string, string[]>, from: string, to: string): boolean {
  if (from === to) return true;
  return map[from]?.includes(to) ?? false;
}

export function assertTransition(
  map: Record<string, string[]>,
  from: string,
  to: string,
  entity = "record",
): void {
  if (!canTransition(map, from, to)) {
    throw new Error(`Invalid ${entity} transition: ${from} -> ${to}`);
  }
}
