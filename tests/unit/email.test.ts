import { describe, expect, it } from "vitest";
import { adminEmailSchema, dedupeRecipients, finalBatchStatus, renderAdminEmail } from "@/server/domain/email";

describe("admin email domain", () => {
  it("validates recipient filters and blocks header injection", () => {
    const base = { content: "Xin chào", userIds: [], idempotencyKey: crypto.randomUUID() };
    expect(adminEmailSchema.safeParse({ ...base, recipientType: "UNKNOWN", subject: "Tin mới" }).success).toBe(false);
    expect(adminEmailSchema.safeParse({ ...base, recipientType: "SPECIFIC_USERS", subject: "Tin mới" }).success).toBe(false);
    expect(adminEmailSchema.safeParse({ ...base, recipientType: "ALL_USERS", subject: "Tin mới\nBcc: bad@example.com" }).success).toBe(false);
  });

  it("deduplicates normalized addresses and skips invalid email", () => {
    const rows = dedupeRecipients([
      { id: "1", email: " User@Example.com " },
      { id: "2", email: "user@example.com" },
      { id: "3", email: "invalid" },
      { id: "4", email: "another@example.com" },
    ]);
    expect(rows.map((item) => item.id)).toEqual(["1", "4"]);
  });

  it("escapes admin text and creates text fallback", () => {
    const result = renderAdminEmail("Xin chào\n\n<script>alert(1)</script>\nBản tin");
    expect(result.text).toContain("<script>");
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("AI Arena Viet Nam");
  });

  it("derives completed, partially failed, and failed batch states", () => {
    expect(finalBatchStatus(2, 0)).toBe("COMPLETED");
    expect(finalBatchStatus(2, 1)).toBe("PARTIALLY_FAILED");
    expect(finalBatchStatus(0, 1)).toBe("FAILED");
  });
});
