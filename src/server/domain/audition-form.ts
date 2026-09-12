import type { SubmissionStatus } from "@prisma/client";

const AUDITION_FORM_FIELDS = [
  "submissionTitle",
  "problemStatement",
  "targetUsers",
  "solutionSummary",
  "expectedImpact",
  "geminiUsageSummary",
  "promptingProcessSummary",
  "technicalApproach",
  "introVideoUrl",
  "deployedDemoUrl",
  "repositoryUrl",
  "designOrSlideUrl",
  "additionalNotes",
] as const;

export type AuditionFormPayload = {
  submissionTitle: string;
  problemStatement: string;
  targetUsers: string;
  solutionSummary: string;
  expectedImpact: string;
  geminiUsageSummary: string;
  promptingProcessSummary: string;
  technicalApproach: string;
  introVideoUrl: string;
  deployedDemoUrl: string;
  repositoryUrl: string;
  designOrSlideUrl: string;
  additionalNotes: string;
  originalityDeclaration: boolean;
  permissionToReviewPrivateLinks: boolean;
};

export function parseAuditionFormData(formData: FormData): AuditionFormPayload {
  const read = (key: string) => String(formData.get(key) ?? "");
  return {
    submissionTitle: read("submissionTitle"),
    problemStatement: read("problemStatement"),
    targetUsers: read("targetUsers"),
    solutionSummary: read("solutionSummary"),
    expectedImpact: read("expectedImpact"),
    geminiUsageSummary: read("geminiUsageSummary"),
    promptingProcessSummary: read("promptingProcessSummary"),
    technicalApproach: read("technicalApproach"),
    introVideoUrl: read("introVideoUrl"),
    deployedDemoUrl: read("deployedDemoUrl"),
    repositoryUrl: read("repositoryUrl"),
    designOrSlideUrl: read("designOrSlideUrl"),
    additionalNotes: read("additionalNotes"),
    originalityDeclaration: formData.get("originalityDeclaration") === "on",
    permissionToReviewPrivateLinks: formData.get("permissionToReviewPrivateLinks") === "on",
  };
}

export function buildAutosaveData(payload: AuditionFormPayload): Record<string, unknown> {
  const data: Record<string, unknown> = {
    originalityDeclaration: payload.originalityDeclaration,
    permissionToReviewPrivateLinks: payload.permissionToReviewPrivateLinks,
  };
  for (const key of AUDITION_FORM_FIELDS) {
    data[key] = payload[key];
  }
  return data;
}

export function editableSubmissionStatuses(allowEditAfterSubmit: boolean): SubmissionStatus[] {
  if (allowEditAfterSubmit) {
    return ["DRAFT", "NEEDS_UPDATE", "SUBMITTED"];
  }
  return ["DRAFT", "NEEDS_UPDATE"];
}

export function isSubmissionEditable(status: SubmissionStatus, allowEditAfterSubmit: boolean): boolean {
  return editableSubmissionStatuses(allowEditAfterSubmit).includes(status);
}
