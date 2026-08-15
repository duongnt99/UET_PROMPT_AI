export type SubmissionSettings = {
  auditionVideoMode: "URL" | "UPLOAD" | "EITHER";
  auditionVideoRequired: boolean;
  demoUrlRequired: boolean;
  repositoryUrlRequired: boolean;
  documentUploadRequired: boolean;
  promptLogRequired: boolean;
};

export type SubmissionDraft = {
  submissionTitle: string;
  problemStatement: string;
  targetUsers: string;
  solutionSummary: string;
  expectedImpact: string;
  geminiUsageSummary: string;
  introVideoUrl?: string | null;
  introVideoAssetId?: string | null;
  deployedDemoUrl?: string | null;
  repositoryUrl?: string | null;
  supportingDocumentAssetId?: string | null;
  promptLogAssetId?: string | null;
  originalityDeclaration: boolean;
};

const URL_PATTERN = /^https?:\/\/.+/i;

export function validateSubmissionRequiredFields(
  draft: SubmissionDraft,
  settings: SubmissionSettings,
): string[] {
  const errors: string[] = [];
  if (!draft.submissionTitle.trim()) errors.push("Thiếu tiêu đề bài dự thi.");
  if (!draft.problemStatement.trim()) errors.push("Thiếu mô tả bài toán.");
  if (!draft.solutionSummary.trim()) errors.push("Thiếu tóm tắt giải pháp.");
  if (!draft.geminiUsageSummary.trim()) errors.push("Thiếu mô tả cách sử dụng Gemini.");
  if (!draft.originalityDeclaration) errors.push("Cần cam kết tính nguyên gốc của bài dự thi.");

  if (settings.auditionVideoRequired) {
    const hasUrl = Boolean(draft.introVideoUrl && URL_PATTERN.test(draft.introVideoUrl));
    const hasUpload = Boolean(draft.introVideoAssetId);
    if (settings.auditionVideoMode === "URL" && !hasUrl) {
      errors.push("Cần đường dẫn video giới thiệu.");
    } else if (settings.auditionVideoMode === "UPLOAD" && !hasUpload) {
      errors.push("Cần tải lên video giới thiệu.");
    } else if (settings.auditionVideoMode === "EITHER" && !hasUrl && !hasUpload) {
      errors.push("Cần video giới thiệu (URL hoặc tệp tải lên).");
    }
  }
  if (settings.demoUrlRequired && !draft.deployedDemoUrl) {
    errors.push("Cần đường dẫn bản demo.");
  }
  if (settings.repositoryUrlRequired && !draft.repositoryUrl) {
    errors.push("Cần đường dẫn mã nguồn.");
  }
  if (settings.documentUploadRequired && !draft.supportingDocumentAssetId) {
    errors.push("Cần tệp tài liệu hỗ trợ.");
  }
  if (settings.promptLogRequired && !draft.promptLogAssetId) {
    errors.push("Cần nhật ký prompt.");
  }
  return errors;
}

export const BLOCKED_UPLOAD_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".dll",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".jar",
  ".app",
  ".dmg",
  ".pkg",
];

export const BLOCKED_UPLOAD_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-executable",
  "application/x-dosexec",
  "application/x-sh",
  "application/java-archive",
];

export function isForbiddenUpload(params: {
  filename: string;
  mimeType: string;
  allowedMimeTypes: string[];
  maxBytes: number;
  sizeBytes: number;
}): { ok: boolean; message?: string } {
  const lower = params.filename.toLowerCase();
  if (BLOCKED_UPLOAD_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return { ok: false, message: "Không cho phép tải lên tệp thực thi." };
  }
  if (BLOCKED_UPLOAD_MIME_TYPES.includes(params.mimeType)) {
    return { ok: false, message: "Loại tệp không được phép." };
  }
  if (!params.allowedMimeTypes.includes(params.mimeType)) {
    return { ok: false, message: "MIME type không nằm trong danh sách cho phép." };
  }
  if (params.sizeBytes > params.maxBytes) {
    return { ok: false, message: "Tệp vượt quá dung lượng tối đa." };
  }
  return { ok: true };
}
