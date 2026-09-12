import { describe, expect, it } from "vitest";
import {
  buildAutosaveData,
  editableSubmissionStatuses,
  isSubmissionEditable,
  parseAuditionFormData,
} from "@/server/domain/audition-form";
import { validateSubmissionRequiredFields } from "@/server/domain/submission-rules";

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
  designOrSlideUrl: "",
  additionalNotes: "",
  originalityDeclaration: true,
  permissionToReviewPrivateLinks: false,
};

const optionalSettings = {
  auditionVideoMode: "URL" as const,
  auditionVideoRequired: false,
  demoUrlRequired: false,
  repositoryUrlRequired: false,
  documentUploadRequired: false,
  promptLogRequired: false,
};

function formDataFrom(payload: Record<string, string | boolean>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "boolean") {
      if (value) formData.set(key, "on");
      continue;
    }
    formData.set(key, value);
  }
  return formData;
}

describe("audition form parsing", () => {
  it("parses originality as false when checkbox absent", () => {
    const formData = formDataFrom({
      submissionTitle: "Tiêu đề",
      problemStatement: "Bài toán",
      targetUsers: "Sinh viên",
      solutionSummary: "Giải pháp",
      expectedImpact: "Tác động",
      geminiUsageSummary: "Gemini",
      promptingProcessSummary: "Prompt",
      technicalApproach: "Kỹ thuật",
      introVideoUrl: "https://youtu.be/demo",
      deployedDemoUrl: "https://demo.example.com",
      repositoryUrl: "https://github.com/example/repo",
      designOrSlideUrl: "",
      additionalNotes: "",
    });
    expect(parseAuditionFormData(formData).originalityDeclaration).toBe(false);
  });

  it("parses originality as true when checkbox checked", () => {
    const formData = formDataFrom({
      ...baseDraft,
      originalityDeclaration: true,
    });
    expect(parseAuditionFormData(formData).originalityDeclaration).toBe(true);
  });

  it("always includes originality in autosave payload", () => {
    const payload = buildAutosaveData({
      ...baseDraft,
      originalityDeclaration: true,
    });
    expect(payload.originalityDeclaration).toBe(true);
    const unchecked = buildAutosaveData({
      ...baseDraft,
      originalityDeclaration: false,
    });
    expect(unchecked.originalityDeclaration).toBe(false);
  });
});

describe("submission originality validation", () => {
  it("rejects submit when originality unchecked", () => {
    const errors = validateSubmissionRequiredFields(
      { ...baseDraft, originalityDeclaration: false },
      optionalSettings,
    );
    expect(errors).toContain("Cần cam kết tính nguyên gốc của bài dự thi.");
  });

  it("passes originality validation when checked", () => {
    const errors = validateSubmissionRequiredFields(baseDraft, optionalSettings);
    expect(errors.some((item) => item.includes("nguyên gốc"))).toBe(false);
  });
});

describe("submission editability", () => {
  it("allows autosave only in draft by default", () => {
    expect(isSubmissionEditable("DRAFT", false)).toBe(true);
    expect(isSubmissionEditable("SUBMITTED", false)).toBe(false);
    expect(editableSubmissionStatuses(false)).toEqual(["DRAFT", "NEEDS_UPDATE"]);
  });

  it("allows submitted edits when competition allows", () => {
    expect(isSubmissionEditable("SUBMITTED", true)).toBe(true);
    expect(editableSubmissionStatuses(true)).toContain("SUBMITTED");
  });
});

describe("autosave payload preserves latest checkbox state", () => {
  it("does not drop originality when text fields autosave with checked box", () => {
    const formData = formDataFrom({
      submissionTitle: "Tiêu đề mới",
      problemStatement: "Bài toán",
      targetUsers: "Sinh viên",
      solutionSummary: "Giải pháp",
      expectedImpact: "Tác động",
      geminiUsageSummary: "Gemini",
      promptingProcessSummary: "Prompt",
      technicalApproach: "Kỹ thuật",
      introVideoUrl: "",
      deployedDemoUrl: "",
      repositoryUrl: "",
      designOrSlideUrl: "",
      additionalNotes: "",
      originalityDeclaration: true,
    });
    const payload = buildAutosaveData(parseAuditionFormData(formData));
    expect(payload.originalityDeclaration).toBe(true);
    expect(payload.submissionTitle).toBe("Tiêu đề mới");
  });
});
