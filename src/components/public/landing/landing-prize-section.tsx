import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Backpack,
  Coffee,
  Gift,
  Laptop,
  Medal,
  Plane,
  Shirt,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

type BenefitItem = {
  icon: LucideIcon;
  text: string;
  strong: string;
  suffix: string;
};

type PrizeTier = {
  title: string;
  badge: string;
  watermark: string;
  podiumOrder: "first" | "second" | "third";
  icon: LucideIcon;
  accent: string;
  accentBg: string;
  accentRing: string;
  champion?: boolean;
  benefits: BenefitItem[];
};

const PRIZE_TIERS: PrizeTier[] = [
  {
    title: "Giải nhất",
    badge: "Giải nhất",
    watermark: "01",
    podiumOrder: "first",
    icon: Trophy,
    accent: "#1a73e8",
    accentBg: "#e8f0fe",
    accentRing: "rgba(66,133,244,0.22)",
    champion: true,
    benefits: [
      {
        icon: Award,
        text: "Danh hiệu ",
        strong: "Prompt Master/AI Arena Champion",
        suffix: " theo quyết định chính thức của BTC.",
      },
      {
        icon: Sparkles,
        text: "",
        strong: "Tài khoản Gemini Ultra trong một năm cho mỗi thành viên trong đội thi.",
        suffix: "",
      },
      {
        icon: Plane,
        text: "",
        strong: "Tham quan trụ sở Google tại Singapore trong 3 ngày 2 đêm.",
        suffix: "",
      },
    ],
  },
  {
    title: "Giải nhì",
    badge: "Giải nhì",
    watermark: "02",
    podiumOrder: "second",
    icon: Medal,
    accent: "#b06000",
    accentBg: "#fef7e0",
    accentRing: "rgba(176,96,0,0.18)",
    benefits: [
      {
        icon: Sparkles,
        text: "",
        strong: "Tài khoản Gemini Ultra trong một năm cho mỗi thành viên trong đội thi.",
        suffix: "",
      },
    ],
  },
  {
    title: "Giải ba",
    badge: "Giải ba",
    watermark: "03",
    podiumOrder: "third",
    icon: Medal,
    accent: "#137333",
    accentBg: "#e6f4ea",
    accentRing: "rgba(19,115,51,0.18)",
    benefits: [
      {
        icon: Sparkles,
        text: "",
        strong: "Tài khoản Gemini Pro trong một năm cho mỗi thành viên trong đội thi.",
        suffix: "",
      },
    ],
  },
];

const GIFT_ITEMS = [
  { label: "Áo polo", icon: Shirt },
  { label: "Balo", icon: Backpack },
  { label: "Cốc giữ nhiệt", icon: Coffee },
  { label: "Túi đựng laptop", icon: Laptop },
] as const;

const PODIUM_MOBILE_ORDER = { first: 1, second: 2, third: 3 } as const;
const PODIUM_DESKTOP_ORDER = { second: 1, first: 2, third: 3 } as const;

function BenefitRow({ icon: Icon, text, strong, suffix, accent }: BenefitItem & { accent: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-transparent bg-white/50 px-1 py-1 transition-colors duration-200 hover:border-black/[0.05] hover:bg-white/80 motion-reduce:transition-none">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
        style={{ color: accent }}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="m-0 text-sm leading-6 text-[#424753]">
        {text}
        <strong className="font-semibold text-[#1c1b1b]">{strong}</strong>
        {suffix}
      </p>
    </div>
  );
}

function PrizePodiumCard({ tier }: { tier: PrizeTier }) {
  const Icon = tier.icon;
  const mobileOrder = PODIUM_MOBILE_ORDER[tier.podiumOrder];
  const desktopOrder = PODIUM_DESKTOP_ORDER[tier.podiumOrder];

  return (
    <article
      className={[
        "group relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-white/88 backdrop-blur-md",
        "shadow-[0_12px_32px_-12px_rgba(66,133,244,0.18)]",
        "transition-[transform,box-shadow,border-color] duration-300 motion-reduce:transition-none",
        "hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-14px_rgba(66,133,244,0.22)] motion-reduce:hover:translate-y-0",
        tier.champion
          ? "border-[#4285F4]/25 px-7 py-8 lg:-translate-y-5 lg:px-8 lg:py-9 lg:hover:-translate-y-[calc(1.25rem+3px)] motion-reduce:lg:translate-y-0 motion-reduce:lg:hover:translate-y-0"
          : "border-black/[0.08] px-6 py-7",
        "order-[var(--mobile-order)] lg:order-[var(--desktop-order)]",
      ].join(" ")}
      style={
        {
          "--mobile-order": mobileOrder,
          "--desktop-order": desktopOrder,
          boxShadow: tier.champion
            ? `0 16px 40px -16px rgba(26,115,232,0.28), inset 0 1px 0 rgba(255,255,255,0.95)`
            : undefined,
        } as CSSProperties
      }
    >
      {tier.champion ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-[#4285F4]/15"
          aria-hidden
        />
      ) : null}
      <div
        className="pointer-events-none absolute -right-2 -top-4 select-none font-extrabold leading-none text-[#1c1b1b]/[0.04]"
        style={{ fontSize: tier.champion ? "7.5rem" : "5.5rem" }}
        aria-hidden
      >
        {tier.watermark}
      </div>
      {tier.champion ? (
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-24 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(66,133,244,0.14)_0%,transparent_72%)] blur-2xl"
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex shrink-0 items-center justify-center rounded-2xl border border-black/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${
              tier.champion ? "h-14 w-14" : "h-11 w-11"
            }`}
            style={{ background: tier.accentBg, color: tier.accent }}
          >
            <Icon className={tier.champion ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
          </span>
          <h3 className={`display font-bold text-[#1c1b1b] ${tier.champion ? "text-2xl" : "text-xl"}`}>
            {tier.title}
          </h3>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em]"
          style={{ color: tier.accent, background: tier.accentBg, borderColor: tier.accentRing }}
        >
          {tier.badge}
        </span>
      </div>

      <div className="relative mt-5 space-y-2.5">
        {tier.benefits.map((benefit) => (
          <BenefitRow key={benefit.strong} {...benefit} accent={tier.accent} />
        ))}
      </div>
    </article>
  );
}

function GiftTile({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl border border-[#4285F4]/10 bg-[#f8fafc]/90 px-3 py-2.5 text-sm text-[#424753] transition-colors duration-200 hover:border-[#4285F4]/25 hover:bg-[#e8f0fe]/40 motion-reduce:transition-none"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#1a73e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="font-medium text-[#1c1b1b]">{label}</span>
    </div>
  );
}

export function LandingPrizeSection() {
  const first = PRIZE_TIERS.find((tier) => tier.podiumOrder === "first")!;
  const second = PRIZE_TIERS.find((tier) => tier.podiumOrder === "second")!;
  const third = PRIZE_TIERS.find((tier) => tier.podiumOrder === "third")!;

  return (
    <section
      id="co-cau-giai-thuong"
      className="relative z-[1] scroll-mt-24 overflow-hidden px-5 py-11 md:px-[clamp(16px,5.2vw,80px)] md:py-14"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-[520px] max-w-5xl bg-[radial-gradient(ellipse_at_center,rgba(66,133,244,0.1)_0%,rgba(251,188,4,0.04)_38%,transparent_72%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1368px]">
        <header className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <p
            className="mb-3 inline-flex items-center rounded-full border border-[#4285F4]/15 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a73e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          >
            AI Arena — Champion Spotlight
          </p>
          <h2 className="display text-[clamp(1.35rem,2.4vw,2.5rem)] font-bold leading-[1.25] tracking-[-0.56px] text-[#424753]">
            Cơ cấu giải thưởng
          </h2>
        </header>

        <div className="grid gap-4 lg:grid-cols-3 lg:items-end lg:gap-5">
          <PrizePodiumCard tier={first} />
          <PrizePodiumCard tier={second} />
          <PrizePodiumCard tier={third} />
        </div>

        <div className="mt-8 md:mt-10">
          <article
            className="overflow-hidden rounded-[32px] border border-black/[0.08] bg-white/85 shadow-[0_14px_36px_-16px_rgba(66,133,244,0.16)] backdrop-blur-md"
          >
            <div className="border-b border-black/[0.06] px-6 py-5 md:px-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#1a73e8]">
                  <Gift className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="display text-xl font-bold text-[#1c1b1b] md:text-[1.35rem]">
                  8 đội vào vòng Chung kết
                </h3>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-2 md:gap-8 md:px-8 md:py-7">
              <div>
                <p className="font-bold text-[#1c1b1b]">Bộ quà tặng của Google</p>
                <div className="mt-4 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                  {GIFT_ITEMS.map((item) => (
                    <GiftTile key={item.label} {...item} />
                  ))}
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-[24px] border border-[#4285F4]/12 bg-gradient-to-br from-[#f8fbff] via-white to-[#e8f0fe]/70 px-5 py-5 md:px-6 md:py-6"
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(66,133,244,0.12)_0%,transparent_70%)]"
                  aria-hidden
                />
                <div className="relative flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#4285F4]/15 bg-white text-[#1a73e8] shadow-[0_8px_20px_-12px_rgba(66,133,244,0.35)]">
                    <Users className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h4 className="display text-lg font-bold text-[#1c1b1b]">Mentoring</h4>
                    <p className="mt-2 text-sm leading-6 text-[#424753]">
                      <strong className="font-semibold text-[#1c1b1b]">
                        Được tập huấn bởi các mentor của Google Lab.
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

      </div>
    </section>
  );
}
