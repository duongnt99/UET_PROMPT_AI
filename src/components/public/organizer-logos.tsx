import { ORGANIZERS } from "@/config/organizers";
import { cn } from "@/lib/utils";

export function OrganizerLogos({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <ul className={cn("flex flex-nowrap items-center gap-2", className)}>
        {ORGANIZERS.map((item) => (
          <li key={item.shortName}>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              title={item.name}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200/80 transition hover:ring-[#C9A227]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.miniImageUrl} alt={item.name} className="h-7 w-7 object-contain" />
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {ORGANIZERS.map((item) => (
        <li key={item.shortName}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm transition hover:border-[#C9A227]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt="" className="h-16 w-auto max-w-[220px] object-contain md:h-20" />
            <span className="text-sm font-medium text-slate-800">{item.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
