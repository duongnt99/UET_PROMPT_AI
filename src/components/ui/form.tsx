import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-slate-800", className)} {...props} />;
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)} {...props} />;
}

export function Badge({
  className,
  tone = "slate",
  ...props
}: React.ComponentProps<"span"> & { tone?: "slate" | "gold" | "green" | "red" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    gold: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
