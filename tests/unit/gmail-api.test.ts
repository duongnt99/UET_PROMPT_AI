import { describe, expect, it } from "vitest";
import { base64UrlEncode, buildMimeMessage } from "@/server/email/mime-message";
import { getGmailApiConfig } from "@/server/email/gmail-api-provider";

describe("gmail api mime", () => {
  it("builds multipart alternative MIME and base64url encodes it", () => {
    const mime = buildMimeMessage({
      from: "AI Arena Viet Nam <noreply@example.com>",
      to: "user@example.com",
      subject: "Xin chào",
      text: "Plain body",
      html: "<p>HTML body</p>",
      messageId: "delivery-1",
    });
    expect(mime).toContain("multipart/alternative");
    expect(mime).toContain("Plain body");
    expect(mime).toContain("<p>HTML body</p>");
    expect(mime).toContain("X-Entity-Ref-ID: delivery-1");

    const encoded = base64UrlEncode(mime);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("encodes non-ascii subject headers", () => {
    const mime = buildMimeMessage({
      from: "AI Arena Viet Nam <noreply@example.com>",
      to: "user@example.com",
      subject: "Thông báo mới",
      text: "Nội dung",
      html: "<p>Nội dung</p>",
    });
    expect(mime).toContain("Subject: =?UTF-8?B?");
  });
});

describe("gmail api config", () => {
  it("reports missing google env vars", () => {
    const original = { ...process.env };
    process.env.EMAIL_PROVIDER = "gmail-api";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REFRESH_TOKEN;
    delete process.env.GOOGLE_GMAIL_USER;

    const result = getGmailApiConfig();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("GOOGLE_CLIENT_ID");
      expect(result.missing).toContain("GOOGLE_REFRESH_TOKEN");
    }

    process.env = original;
  });
});
