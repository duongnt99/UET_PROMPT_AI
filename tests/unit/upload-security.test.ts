import { describe, expect, it } from "vitest";
import { isForbiddenUpload } from "@/server/domain/submission-rules";

describe("upload security", () => {
  it("rejects executables", () => {
    expect(
      isForbiddenUpload({
        filename: "payload.exe",
        mimeType: "application/pdf",
        allowedMimeTypes: ["application/pdf"],
        maxBytes: 1000,
        sizeBytes: 10,
      }).ok,
    ).toBe(false);
  });
});
