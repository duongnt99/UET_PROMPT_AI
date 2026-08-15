import { formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "Đang cập nhật";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return formatInTimeZone(date, APP_TIMEZONE, "dd/MM/yyyy HH:mm");
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Đang cập nhật";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return formatInTimeZone(date, APP_TIMEZONE, "dd/MM/yyyy");
}

export function serverNow(): Date {
  return new Date();
}
