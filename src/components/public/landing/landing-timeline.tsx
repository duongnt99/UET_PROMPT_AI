import { FormattedText } from "@/components/public/formatted-text";

export type LandingTimelineItem = {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
};

type PhaseStyle = {
  color: string;
  bgBadge: string;
  badgeColor: string;
  bgGradient: string;
  above: boolean;
};

const PHASE_STYLES: PhaseStyle[] = [
  {
    color: "#4285f4",
    bgBadge: "#eef3fb",
    badgeColor: "#1a73e8",
    bgGradient: "linear-gradient(157.9deg,#fff 0%,rgba(240,253,250,.4) 100%)",
    above: true,
  },
  {
    color: "#db4437",
    bgBadge: "#fff3f2",
    badgeColor: "#db4437",
    bgGradient: "linear-gradient(208.5deg,#fff 0%,rgba(244,224,222,.4) 100%)",
    above: false,
  },
  {
    color: "#f4b400",
    bgBadge: "#fff1f2",
    badgeColor: "#b06000",
    bgGradient: "linear-gradient(159deg,#fff 0%,rgba(255,241,242,.4) 100%)",
    above: true,
  },
  {
    color: "#0f9d58",
    bgBadge: "#c6fee3",
    badgeColor: "#0f9d58",
    bgGradient: "linear-gradient(148.5deg,#fff 0%,rgba(236,253,245,.5) 100%)",
    above: false,
  },
];

function TimelineCard({ item, style }: { item: LandingTimelineItem; style: PhaseStyle }) {
  return (
    <article
      className="landing-timeline-card box-border flex w-full max-w-[480px] flex-col gap-[7px] rounded-2xl px-5 py-4"
      style={{
        background: style.bgGradient,
        border: `1px solid ${style.color}`,
        boxShadow: "0 1px 2px rgba(0,0,0,.05)",
      }}
    >
      <span
        className="display inline-flex self-start rounded-lg px-2.5 py-1 text-xs font-bold tracking-[0.5px]"
        style={{
          background: style.bgBadge,
          border: `1px solid ${style.color}`,
          color: style.badgeColor,
        }}
      >
        {item.dateLabel}
      </span>
      <p className="display m-0 text-[17px] font-extrabold leading-[26px] tracking-[-0.4px] text-[#1e293b]">
        {item.title}
      </p>
      <FormattedText
        text={item.description}
        className="text-[13.5px] leading-[21px] text-[#475569] [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_strong]:font-bold [&_ul]:m-0 [&_ul]:flex [&_ul]:list-none [&_ul]:flex-col [&_ul]:gap-[5px] [&_ul]:p-0"
      />
    </article>
  );
}

export function LandingTimeline({ items }: { items: LandingTimelineItem[] }) {
  const phases = items.slice(0, 4).map((item, index) => ({
    item,
    style: PHASE_STYLES[index % PHASE_STYLES.length],
  }));

  return (
    <section id="lich-trinh" className="relative z-[1] scroll-mt-24 px-5 py-10 md:px-[clamp(16px,16.8vw,256px)] md:pb-[60px]">
      <div className="mx-auto max-w-[1500px]">
        <h2 className="display mb-12 text-center text-[clamp(18px,2.6vw,40px)] font-bold leading-[56px] tracking-[-0.56px] text-[#424753]">
          Lịch trình cuộc thi
        </h2>

        <div className="landing-timeline-desktop relative hidden lg:grid">
          <div className="col-span-full row-start-3 flex h-full w-full items-center">
            <div
              className="absolute left-0 right-0 z-0 h-[3px]"
              style={{
                background: "linear-gradient(90deg, #db4437 12%, #f4b400 42%, #0f9d58 73%, #4285f4 100%)",
              }}
            />
          </div>

          {phases.map(({ item, style }, index) => {
            const col = index + 1;
            return (
              <div key={item.id} className="contents">
                <div
                  className="flex items-end justify-center"
                  style={{ gridRow: 1, gridColumn: col }}
                >
                  {style.above ? <TimelineCard item={item} style={style} /> : null}
                </div>
                <div className="flex justify-center" style={{ gridRow: 2, gridColumn: col }}>
                  {style.above ? (
                    <div className="h-full w-0.5" style={{ background: style.color }} />
                  ) : null}
                </div>
                <div
                  className="relative z-[2] flex items-center justify-center"
                  style={{ gridRow: 3, gridColumn: col }}
                >
                  <div
                    className="h-5 w-5 shrink-0 rounded-full shadow-[0_0_0_3px_#fff,0_1px_4px_rgba(0,0,0,0.2)]"
                    style={{ background: style.color }}
                  />
                </div>
                <div className="flex justify-center" style={{ gridRow: 4, gridColumn: col }}>
                  {!style.above ? (
                    <div className="h-full w-0.5" style={{ background: style.color }} />
                  ) : null}
                </div>
                <div
                  className="flex items-start justify-center"
                  style={{ gridRow: 5, gridColumn: col }}
                >
                  {!style.above ? <TimelineCard item={item} style={style} /> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="landing-timeline-mobile mx-auto flex max-w-[480px] flex-col gap-5 lg:hidden">
          {phases.map(({ item, style }) => (
            <div key={item.id} className="flex items-start gap-3.5">
              <div
                className="mt-[18px] h-4 w-4 shrink-0 rounded-full shadow-[0_0_0_3px_#fff,0_1px_3px_rgba(0,0,0,0.15)]"
                style={{ background: style.color }}
              />
              <div className="flex-1">
                <TimelineCard item={item} style={style} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
