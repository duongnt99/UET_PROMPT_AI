import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF]/g;
const UNICODE_SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

export function normalizePasswordInput(password: string): string {
  return password
    .normalize("NFC")
    .replace(INVISIBLE_CHARS, "")
    .replace(UNICODE_SPACES, " ")
    .trim();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(normalizePasswordInput(password), 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(normalizePasswordInput(password), passwordHash);
}

export function createRawToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
