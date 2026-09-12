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
  promptingProcessSummary: string;
  technicalApproach: string;
  introVideoUrl?: string | null;
  introVideoAssetId?: string | null;
  deployedDemoUrl?: string | null;
  repositoryUrl?: string | null;
  supportingDocumentAssetId?: string | null;
  promptLogAssetId?: string | null;
  originalityDeclaration: boolean;
};

export const SUBMISSION_URL_FORMAT_HINT = "https://example.com/...";

export function isValidSubmissionUrl(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function requireText(errors: string[], value: string | null | undefined, message: string) {
  if (!value?.trim()) errors.push(message);
}

function requireUrl(errors: string[], value: string | null | undefined, label: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    errors.push(`Thiếu ${label}.`);
    return;
  }
  if (!isValidSubmissionUrl(trimmed)) {
    errors.push(
      `${label} không hợp lệ. Vui lòng dùng định dạng ${SUBMISSION_URL_FORMAT_HINT}`,
    );
  }
}

export function validateSubmissionRequiredFields(
  draft: SubmissionDraft,
  settings: SubmissionSettings,
): string[] {
  const errors: string[] = [];

  requireText(errors, draft.submissionTitle, "Thiếu tiêu đề bài dự thi.");
  requireText(errors, draft.problemStatement, "Thiếu mô tả bài toán.");
  requireText(errors, draft.targetUsers, "Thiếu người dùng mục tiêu.");
  requireText(errors, draft.solutionSummary, "Thiếu tóm tắt giải pháp.");
  requireText(errors, draft.expectedImpact, "Thiếu tác động kỳ vọng.");
  requireText(errors, draft.geminiUsageSummary, "Thiếu mô tả cách sử dụng Gemini.");
  requireText(errors, draft.promptingProcessSummary, "Thiếu quy trình prompting.");
  requireText(errors, draft.technicalApproach, "Thiếu hướng tiếp cận kỹ thuật.");

  if (!draft.originalityDeclaration) {
    errors.push("Cần cam kết tính nguyên gốc của bài dự thi.");
  }

  requireUrl(errors, draft.introVideoUrl, "URL video giới thiệu");
  requireUrl(errors, draft.deployedDemoUrl, "URL demo");
  requireUrl(errors, draft.repositoryUrl, "URL repository");

  if (settings.auditionVideoRequired) {
    const hasUrl = isValidSubmissionUrl(draft.introVideoUrl);
    const hasUpload = Boolean(draft.introVideoAssetId);
    if (settings.auditionVideoMode === "UPLOAD" && !hasUpload && !hasUrl) {
      errors.push("Cần tải lên video giới thiệu.");
    } else if (settings.auditionVideoMode === "EITHER" && !hasUrl && !hasUpload) {
      errors.push("Cần video giới thiệu (URL hoặc tệp tải lên).");
    }
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
