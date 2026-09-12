"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { autosaveAuditionAction, submitAuditionAction } from "@/server/actions/participant-actions";
import { parseAuditionFormData } from "@/server/domain/audition-form";
import {
  SUBMISSION_URL_FORMAT_HINT,
  validateSubmissionRequiredFields,
} from "@/server/domain/submission-rules";
import { submissionStatusLabel } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";

const TEXT_FIELDS = [
  ["submissionTitle", "Tiêu đề"],
  ["problemStatement", "Bài toán"],
  ["targetUsers", "Người dùng mục tiêu"],
  ["solutionSummary", "Tóm tắt giải pháp"],
  ["expectedImpact", "Tác động kỳ vọng"],
  ["geminiUsageSummary", "Cách sử dụng Gemini"],
  ["promptingProcessSummary", "Quy trình prompting"],
  ["technicalApproach", "Hướng tiếp cận kỹ thuật"],
  ["introVideoUrl", "URL video giới thiệu"],
  ["deployedDemoUrl", "URL demo"],
  ["repositoryUrl", "URL repository"],
] as const;

type TextFieldName = (typeof TEXT_FIELDS)[number][0];

const LOCKED_STATUSES = new Set(["SUBMITTED", "LOCKED", "UNDER_REVIEW", "SCORED"]);

type AuditionFormSettings = {
  auditionVideoMode: "URL" | "UPLOAD" | "EITHER";
  auditionVideoRequired: boolean;
  demoUrlRequired: boolean;
  repositoryUrlRequired: boolean;
  documentUploadRequired: boolean;
  promptLogRequired: boolean;
};

function buildInitialFields(values: Record<string, string>): Record<TextFieldName, string> {
  const fields: Record<string, string> = {};
  for (const [name] of TEXT_FIELDS) {
    fields[name] = values[name] ?? "";
  }
  return fields as Record<TextFieldName, string>;
}

export function AuditionForm({
  initialStatus,
  values,
  settings,
}: {
  initialStatus: string;
  values: Record<string, string>;
  settings: AuditionFormSettings;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyKeyRef = useRef(nanoid());
  const autosaveInFlight = useRef<Promise<unknown> | null>(null);

  const [status, setStatus] = useState(initialStatus);
  const [fields, setFields] = useState(() => buildInitialFields(values));
  const [saved, setSaved] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originalityChecked, setOriginalityChecked] = useState(values.originalityDeclaration === "true");
  const [originalityError, setOriginalityError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocked = LOCKED_STATUSES.has(status) || isSubmitting;

  function setField(name: TextFieldName, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  async function persistDraft(form: HTMLFormElement) {
    if (isLocked) return;
    const formData = new FormData(form);
    formData.set("idempotencyKey", idempotencyKeyRef.current);
    const promise = autosaveAuditionAction(formData).then((result) => {
      if (!result.skipped) {
        setSaved("Đã lưu");
      }
    });
    autosaveInFlight.current = promise;
    try {
      await promise;
    } finally {
      if (autosaveInFlight.current === promise) {
        autosaveInFlight.current = null;
      }
    }
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocked) return;

    const form = formRef.current ?? event.currentTarget;
    setErrorMessage(null);
    setOriginalityError(null);

    try {
      await persistDraft(form);
    } catch {
      // Keep local form state even if autosave fails.
    }

    if (!originalityChecked) {
      setOriginalityError("Cần cam kết tính nguyên gốc của bài dự thi.");
      toast.error("Cần cam kết tính nguyên gốc của bài dự thi trước khi nộp.");
      return;
    }

    const formData = new FormData(form);
    const draft = parseAuditionFormData(formData);
    const validationErrors = validateSubmissionRequiredFields(draft, settings);
    if (validationErrors.length > 0) {
      const originalityMsg = validationErrors.find((item) => item.includes("nguyên gốc"));
      if (originalityMsg) setOriginalityError(originalityMsg);
      setErrorMessage(validationErrors.join(" "));
      return;
    }

    setIsSubmitting(true);
    try {
      if (autosaveInFlight.current) {
        await autosaveInFlight.current;
      }
      formData.set("idempotencyKey", idempotencyKeyRef.current);
      if (!formData.get("originalityDeclaration")) {
        formData.set("originalityDeclaration", "on");
      }
      const result = await submitAuditionAction(formData);
      if (result.ok) {
        setStatus("SUBMITTED");
        setSaved(null);
        toast.success("Bài dự thi đã được nộp thành công.");
        router.refresh();
        return;
      }
      setErrorMessage(result.message ?? "Nộp bài thất bại.");
    } catch {
      setErrorMessage("Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleFormSubmit}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKeyRef.current} />
      <p className="text-sm text-slate-700">
        Trạng thái: <strong>{submissionStatusLabel(status)}</strong>
      </p>
      {status === "SUBMITTED" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Bài dự thi đã được nộp thành công.
        </p>
      ) : null}
      {TEXT_FIELDS.map(([name, label]) => (
        <div key={name}>
          <Label htmlFor={name}>
            {label}
            {name.includes("Url") ? " *" : ""}
          </Label>
          {name.includes("Url") || name === "submissionTitle" ? (
            <Input
              id={name}
              name={name}
              type={name.includes("Url") ? "url" : "text"}
              inputMode={name.includes("Url") ? "url" : undefined}
              placeholder={name.includes("Url") ? SUBMISSION_URL_FORMAT_HINT : undefined}
              value={fields[name]}
              disabled={isLocked}
              className="mt-1"
              onChange={(event) => setField(name, event.target.value)}
              onBlur={(event) => {
                const form = event.currentTarget.form;
                if (!form || isLocked) return;
                void persistDraft(form);
              }}
            />
          ) : (
            <Textarea
              id={name}
              name={name}
              value={fields[name]}
              disabled={isLocked}
              required
              className="mt-1"
              onChange={(event) => setField(name, event.target.value)}
              onBlur={(event) => {
                const form = event.currentTarget.form;
                if (!form || isLocked) return;
                void persistDraft(form);
              }}
            />
          )}
        </div>
      ))}
      <div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            name="originalityDeclaration"
            checked={originalityChecked}
            disabled={isLocked}
            onChange={(event) => {
              const checked = event.target.checked;
              setOriginalityChecked(checked);
              if (checked) {
                setOriginalityError(null);
              }
              const form = event.currentTarget.form;
              if (!form || isLocked) return;
              void persistDraft(form);
            }}
          />
          Cam kết bài dự thi là nguyên gốc
        </label>
        {originalityError ? <p className="mt-1 text-sm text-red-600">{originalityError}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLocked}>
          {isSubmitting ? "Đang nộp..." : "Nộp bài"}
        </Button>
        {saved && !isLocked ? <span className="text-sm text-emerald-700">{saved}</span> : null}
      </div>
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
    </form>
  );
}
