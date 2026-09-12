import { randomBytes } from "node:crypto";

function encodeHeaderValue(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function sanitizeHeaderLine(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

export function base64UrlEncode(value: string | Buffer) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function buildMimeMessage(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId?: string;
}) {
  const boundary = `boundary_${randomBytes(16).toString("hex")}`;
  const headers = [
    `From: ${sanitizeHeaderLine(input.from)}`,
    `To: ${sanitizeHeaderLine(input.to)}`,
    `Subject: ${encodeHeaderValue(sanitizeHeaderLine(input.subject))}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  if (input.messageId) {
    headers.push(`X-Entity-Ref-ID: ${sanitizeHeaderLine(input.messageId)}`);
  }

  const body = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}
