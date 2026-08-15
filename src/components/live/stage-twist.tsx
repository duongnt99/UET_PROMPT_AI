"use client";

import { useEventState } from "@/components/live/use-event-state";

export function StageTwistScreen() {
  const data = useEventState(1000);
  const twist = data?.match?.twist;
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
      <div className="max-w-5xl text-center">
        <p className="text-[#C9A227]">On-stage Twist</p>
        <h1 className="display mt-4 text-5xl">{twist?.title ?? (data ? "Chưa công bố" : "Đang tải…")}</h1>
        <p className="mt-6 text-2xl">{twist?.content ?? ""}</p>
      </div>
    </div>
  );
}
