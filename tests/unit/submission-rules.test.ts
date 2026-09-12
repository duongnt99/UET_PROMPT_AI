import { describe, expect, it } from "vitest";
import {
  isValidSubmissionUrl,
  validateSubmissionRequiredFields,
} from "@/server/domain/submission-rules";

const baseDraft = {
  submissionTitle: "Ứng dụng hỗ trợ học tập",
  problemStatement: "Sinh viên khó theo dõi tiến độ",
  targetUsers: "Sinh viên",
  solutionSummary: "Trợ lý Gemini lập kế hoạch học",
  expectedImpact: "Tăng hoàn thành bài tập",
  geminiUsageSummary: "Dùng Gemini để sinh lộ trình",
  promptingProcessSummary: "Prompt theo bước",
  technicalApproach: "Next.js + Gemini",
  introVideoUrl: "https://youtu.be/demo",
  deployedDemoUrl: "https://demo.example.com",
  repositoryUrl: "https://github.com/example/repo",
  originalityDeclaration: true,
};

const optionalSettings = {
  auditionVideoMode: "URL" as const,
  auditionVideoRequired: false,
  demoUrlRequired: false,
  repositoryUrlRequired: false,
  documentUploadRequired: false,
  promptLogRequired: false,
};

describe("submission required fields", () => {
  it("accepts a complete draft with valid URLs", () => {
    const errors = validateSubmissionRequiredFields(baseDraft, optionalSettings);
    expect(errors).toEqual([]);
  });

  it("rejects missing text fields", () => {
    const errors = validateSubmissionRequiredFields(
      { ...baseDraft, targetUsers: "", technicalApproach: "  " },
      optionalSettings,
    );
    expect(errors).toContain("Thiếu người dùng mục tiêu.");
    expect(errors).toContain("Thiếu hướng tiếp cận kỹ thuật.");
  });

  it("requires originality declaration", () => {
    const errors = validateSubmissionRequiredFields(
      { ...baseDraft, originalityDeclaration: false },
      optionalSettings,
    );
    expect(errors).toContain("Cần cam kết tính nguyên gốc của bài dự thi.");
  });

  it("requires all audition URLs", () => {
    const errors = validateSubmissionRequiredFields(
      { ...baseDraft, introVideoUrl: "", deployedDemoUrl: "", repositoryUrl: "" },
      optionalSettings,
    );
    expect(errors).toContain("Thiếu URL video giới thiệu.");
    expect(errors).toContain("Thiếu URL demo.");
    expect(errors).toContain("Thiếu URL repository.");
  });

  it("rejects invalid URL format", () => {
    const errors = validateSubmissionRequiredFields(
      {
        ...baseDraft,
        introVideoUrl: "youtu.be/demo",
        deployedDemoUrl: "demo.com",
        repositoryUrl: "github.com/example",
      },
      optionalSettings,
    );
    expect(errors.some((item) => item.includes("URL video giới thiệu không hợp lệ"))).toBe(true);
    expect(errors.some((item) => item.includes("URL demo không hợp lệ"))).toBe(true);
    expect(errors.some((item) => item.includes("URL repository không hợp lệ"))).toBe(true);
  });

  it("requires video upload when configured for upload-only mode", () => {
    const errors = validateSubmissionRequiredFields(
      { ...baseDraft, introVideoUrl: "", introVideoAssetId: null },
      {
        ...optionalSettings,
        auditionVideoRequired: true,
        auditionVideoMode: "UPLOAD",
      },
    );
    expect(errors).toContain("Cần tải lên video giới thiệu.");
  });
});

describe("submission URL format", () => {
  it("accepts http and https URLs", () => {
    expect(isValidSubmissionUrl("https://example.com/path")).toBe(true);
    expect(isValidSubmissionUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects bare domains and free text", () => {
    expect(isValidSubmissionUrl("example.com")).toBe(false);
    expect(isValidSubmissionUrl("demo")).toBe(false);
    expect(isValidSubmissionUrl("")).toBe(false);
  });
});
