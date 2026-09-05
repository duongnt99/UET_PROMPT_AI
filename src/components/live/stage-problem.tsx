"use client";

import { useEventState } from "@/components/live/use-event-state";

export function StageProblemScreen() {
  const data = useEventState(1000);
  const problem = data?.match?.problem;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1F3A] p-8 text-white">
      <div className="max-w-5xl text-center">
        <p className="text-[#C9A227]">Đề thi chung</p>
        <h1 className="display mt-4 text-5xl">
          {problem?.title ?? (data ? "Chưa gán đề cho trận hiện tại" : "Đang tải…")}
        </h1>
        {problem?.prompt ? <p className="mt-6 whitespace-pre-wrap text-2xl text-white/85">{problem.prompt}</p> : null}
      </div>
    </div>
  );
}
