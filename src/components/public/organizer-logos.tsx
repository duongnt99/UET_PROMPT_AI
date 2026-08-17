import { ORGANIZERS } from "@/config/organizers";
import { cn } from "@/lib/utils";

const SIZE = {
  header: "h-8 max-w-[108px] md:h-9 md:max-w-[128px]",
  footer: "h-10 max-w-[140px] md:h-12 md:max-w-[168px]",
  section: "h-16 max-w-[200px] md:h-20 md:max-w-[240px]",
} as const;

export function OrganizerLogos({
  size = "section",
  labeled = false,
  className,
}: {
  size?: keyof typeof SIZE;
  labeled?: boolean;
  className?: string;
}) {
  if (labeled) {
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
              <img src={item.imageUrl} alt="" className={cn("w-auto object-contain", SIZE[size])} />
              <span className="text-sm font-medium text-slate-800">{item.name}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("flex flex-wrap items-center gap-2 md:gap-3", className)}>
      {ORGANIZERS.map((item) => (
        <li key={item.shortName}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-[#C9A227]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.name} className={cn("w-auto object-contain", SIZE[size])} />
          </a>
        </li>
      ))}
    </ul>
  );
}
