"use client";

import { useState } from "react";
import { autosaveAuditionAction, submitAuditionAction } from "@/server/actions/participant-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";

export function AuditionForm({
  disabled,
  values,
}: {
  disabled: boolean;
  values: Record<string, string>;
}) {
  const [saved, setSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form className="space-y-4">
      {[
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
      ].map(([name, label]) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          {name.includes("Url") || name === "submissionTitle" ? (
            <Input
              id={name}
              name={name}
              defaultValue={values[name] ?? ""}
              disabled={disabled}
              className="mt-1"
              onBlur={async (event) => {
                if (disabled) return;
                const formData = new FormData(event.currentTarget.form ?? undefined);
                await autosaveAuditionAction(formData);
                setSaved("Đã lưu");
              }}
            />
          ) : (
            <Textarea
              id={name}
              name={name}
              defaultValue={values[name] ?? ""}
              disabled={disabled}
              className="mt-1"
              onBlur={async (event) => {
                if (disabled) return;
                const formData = new FormData(event.currentTarget.form ?? undefined);
                await autosaveAuditionAction(formData);
                setSaved("Đã lưu");
              }}
            />
          )}
        </div>
      ))}
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="originalityDeclaration" defaultChecked={values.originalityDeclaration === "true"} disabled={disabled} />
        Cam kết bài dự thi là nguyên gốc
      </label>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={disabled}
          formAction={async (formData) => {
            const result = await submitAuditionAction(formData);
            setMessage("ok" in result && result.ok ? "Đã nộp bài Audition." : "message" in result ? result.message ?? "Lỗi" : "Lỗi");
          }}
        >
          Nộp bài
        </Button>
        {saved ? <span className="text-sm text-emerald-700">{saved}</span> : null}
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
