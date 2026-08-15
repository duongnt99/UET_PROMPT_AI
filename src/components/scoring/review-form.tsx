"use client";

import { useState } from "react";
import { saveReviewAction, submitReviewAction } from "@/server/actions/review-actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";

type Criterion = { id: string; titleVi: string; weight: string; minScore: string; maxScore: string };

export function ReviewForm({
  assignmentId,
  criteria,
  locked,
}: {
  assignmentId: string;
  criteria: Criterion[];
  locked: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form className="space-y-4">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      {criteria.map((criterion) => (
        <div key={criterion.id} className="rounded-xl border p-3">
          <Label>
            {criterion.titleVi} ({criterion.weight}%)
          </Label>
          <Input
            name={`score-${criterion.id}`}
            type="number"
            step={0.5}
            min={criterion.minScore}
            max={criterion.maxScore}
            disabled={locked}
            className="mt-1"
          />
          <Textarea name={`comment-${criterion.id}`} placeholder="Nhận xét tiêu chí" disabled={locked} className="mt-2" />
        </div>
      ))}
      <Textarea name="overallComment" placeholder="Nhận xét tổng" disabled={locked} />
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="outline"
          disabled={locked}
          formAction={async (formData) => {
            const items = criteria.map((criterion) => ({
              criterionId: criterion.id,
              rawScore: String(formData.get(`score-${criterion.id}`) ?? "0"),
              comment: String(formData.get(`comment-${criterion.id}`) ?? ""),
            }));
            formData.set("items", JSON.stringify(items));
            await saveReviewAction(formData);
            setMessage("Đã lưu nháp");
          }}
        >
          Lưu nháp
        </Button>
        <Button
          type="submit"
          disabled={locked}
          formAction={async (formData) => {
            await submitReviewAction(formData);
            setMessage("Đã nộp đánh giá");
          }}
        >
          Nộp đánh giá
        </Button>
      </div>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
