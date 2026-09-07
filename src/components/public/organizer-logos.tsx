import { ORGANIZERS, type Organizer } from "@/config/organizers";
import { cn } from "@/lib/utils";

export function OrganizerLogos({
  variant = "full",
  className,
  items = ORGANIZERS,
}: {
  variant?: "full" | "compact" | "bare";
  className?: string;
  items?: readonly Organizer[];
}) {
  if (variant === "compact") {
    return (
      <ul className={cn("flex flex-nowrap items-center gap-2", className)}>
        {items.map((item) => (
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

  if (variant === "bare") {
    return (
      <ul className={cn("flex flex-wrap items-center justify-center gap-12 md:gap-16", className)}>
        {items.map((item) => (
          <li key={item.shortName}>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              title={item.name}
              className="block transition hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className={cn(
                  "w-auto object-contain",
                  item.role === "HOST"
                    ? "h-32 max-w-[181px] md:h-[181px]"
                    : "h-24 max-w-[320px] md:h-36 md:max-w-[436px]",
                )}
              />
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {items.map((item) => (
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
