import { describe, expect, it } from "vitest";
import { validateSubmissionRequiredFields } from "@/server/domain/submission-rules";

const baseDraft = {
  submissionTitle: "Ứng dụng hỗ trợ học tập",
  problemStatement: "Sinh viên khó theo dõi tiến độ",
  targetUsers: "Sinh viên",
  solutionSummary: "Trợ lý Gemini lập kế hoạch học",
  expectedImpact: "Tăng hoàn thành bài tập",
  geminiUsageSummary: "Dùng Gemini để sinh lộ trình",
  originalityDeclaration: true,
};

describe("submission required fields", () => {
  it("does not require optional artifacts when settings leave them optional", () => {
    const errors = validateSubmissionRequiredFields(baseDraft, {
      auditionVideoMode: "URL",
      auditionVideoRequired: false,
      demoUrlRequired: false,
      repositoryUrlRequired: false,
      documentUploadRequired: false,
      promptLogRequired: false,
    });
    expect(errors).toEqual([]);
  });

  it("requires video URL when configured", () => {
    const errors = validateSubmissionRequiredFields(baseDraft, {
      auditionVideoMode: "URL",
      auditionVideoRequired: true,
      demoUrlRequired: false,
      repositoryUrlRequired: false,
      documentUploadRequired: false,
      promptLogRequired: false,
    });
    expect(errors.some((item) => item.includes("video"))).toBe(true);
  });
});
