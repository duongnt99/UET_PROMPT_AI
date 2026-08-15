export type DeadlineKind = "registration" | "submission" | "review";

export function parseDeadline(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isWithinWindow(params: {
  now: Date;
  openAt: string | Date | null | undefined;
  closeAt: string | Date | null | undefined;
  overrideDeadline?: string | Date | null;
}): boolean {
  const now = params.now.getTime();
  const openAt = parseDeadline(params.openAt);
  const closeAt = params.overrideDeadline
    ? parseDeadline(params.overrideDeadline)
    : parseDeadline(params.closeAt);
  if (openAt && now < openAt.getTime()) return false;
  if (closeAt && now > closeAt.getTime()) return false;
  return true;
}

export function isDeadlinePassed(params: {
  now: Date;
  closeAt: string | Date | null | undefined;
  overrideDeadline?: string | Date | null;
}): boolean {
  const closeAt = params.overrideDeadline
    ? parseDeadline(params.overrideDeadline)
    : parseDeadline(params.closeAt);
  if (!closeAt) return false;
  return params.now.getTime() > closeAt.getTime();
}

export function remainingMs(params: {
  now: Date;
  closeAt: string | Date | null | undefined;
  overrideDeadline?: string | Date | null;
}): number | null {
  const closeAt = params.overrideDeadline
    ? parseDeadline(params.overrideDeadline)
    : parseDeadline(params.closeAt);
  if (!closeAt) return null;
  return closeAt.getTime() - params.now.getTime();
}
