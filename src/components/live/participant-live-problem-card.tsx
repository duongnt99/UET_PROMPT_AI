"use client";

import { Card } from "@/components/ui/form";
import { useEventState } from "@/components/live/use-event-state";

export function ParticipantLiveProblemCard({
  fallbackTitle,
  fallbackPrompt,
}: {
  fallbackTitle: string;
  fallbackPrompt: string;
}) {
  const eventState = useEventState(2500);
  const synced = eventState !== null;
  const problem = eventState?.match?.problem;

  let title: string;
  let prompt: string;
  if (!synced) {
    title = fallbackTitle;
    prompt = fallbackPrompt;
  } else if (!problem?.title?.trim() && !problem?.prompt?.trim()) {
    title = "Đề thi đang được chuẩn bị";
    prompt = "Ban Tổ chức chưa công bố nội dung đề.";
  } else {
    title = problem?.title?.trim() || "Đề thi đang được chuẩn bị";
    prompt = problem?.prompt?.trim() || "Ban Tổ chức chưa công bố nội dung đề.";
  }

  return (
    <Card className="mt-6">
      <h2 className="text-xl font-semibold">{title || "Đề thi đang được chuẩn bị"}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {prompt || "Ban Tổ chức chưa công bố nội dung đề."}
      </p>
    </Card>
  );
}
