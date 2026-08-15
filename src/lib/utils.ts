import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeEmail(email: string): string {
  return email
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .trim()
    .toLowerCase();
}

export function toContentSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replaceAll("đ", "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug;
}

export function generateCode(prefix: string, size = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < size; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${body}`;
}

export function sanitizeObjectKey(filename: string): string {
  const cleaned = filename
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/g, "")
    .slice(0, 120);
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${random}-${cleaned || "file"}`;
}

export function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function toCsvWithBom(headers: string[], rows: string[][]): string {
  const lines = [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))];
  return `\uFEFF${lines.join("\n")}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function pagination(page = 1, pageSize = 20) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.min(100, Math.floor(pageSize)) : 20;
  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  };
}
