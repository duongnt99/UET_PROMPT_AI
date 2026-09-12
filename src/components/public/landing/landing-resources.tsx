import type { LandingResourcesContent } from "@/config/landing-resources";

export function LandingResources({ content }: { content: LandingResourcesContent }) {
  return (
    <section id="tai-nguyen" className="relative z-[1] scroll-mt-24 px-5 pb-20 md:px-[clamp(16px,16.8vw,256px)] md:pb-[60px]">
      <div className="mx-auto max-w-[1016px]">
        <h2 className="display mb-8 text-center text-[clamp(18px,2.2vw,32px)] font-bold leading-[48px] tracking-[-0.56px] text-[#1c1b1b]">
          {content.title}
        </h2>

        <div className="landing-resources-grid mt-8">
          <div className="landing-resource-card relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a73e8] to-[#4285f4] p-6 text-white shadow-[0_10px_30px_0_rgba(26,115,232,0.15)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10 flex flex-1 flex-col">
              <span className="inline-flex self-start rounded-2xl bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md">
                {content.featuredBadge}
              </span>
              <p className="display mt-3 text-[1.375rem] font-extrabold leading-8">{content.featuredTitle}</p>
              <p className="mt-3 flex-1 text-[15px] leading-6 text-white/90">{content.featuredDescription}</p>
              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={content.handbookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-extrabold shadow-md transition hover:bg-[#f8fafc]"
                  style={{ color: "#1a73e8" }}
                >
                  <span aria-hidden>📚</span>
                  <span>Cẩm nang VibeCoding</span>
                </a>
                <a
                  href={content.guideUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur-sm transition hover:bg-white/25"
                >
                  🚀 Hướng dẫn từng bước
                </a>
              </div>
            </div>
          </div>

          <div className="landing-resource-card rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_10px_30px_0_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef7e0] text-xl">💡</span>
              <p className="display text-xl font-extrabold text-[#1c1b1b]">{content.gridTitle}</p>
            </div>
            <p className="mt-3 text-[15px] leading-6 text-[#424753]">{content.gridDescription}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {content.links.map((link) => (
                <a
                  key={`${link.url}-${link.label}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="landing-resource-link flex items-center gap-3 rounded-xl border border-[#4285F4]/10 bg-white/90 px-3.5 py-3 text-sm font-semibold text-[#1c1b1b] no-underline shadow-sm transition hover:border-[#4285F4] hover:bg-[#e8f0fe]"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[#f8fafc] text-sm">
                    {link.icon}
                  </span>
                  <span className="leading-5">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
