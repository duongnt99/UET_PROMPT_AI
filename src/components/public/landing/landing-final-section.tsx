import { LANDING_ASSETS } from "@/config/landing-assets";

export type LandingFinalRound = {
  title: string;
  color: string;
  iconBg: string;
  iconSrc: string;
  body: string;
};

export type LandingCriterion = {
  id: string;
  weight: string;
  title: string;
  description: string;
  color: string;
  bgLight: string;
};

const CRITERIA_ACCENTS = [
  { color: "#1a73e8", bgLight: "#e8f0fe" },
  { color: "#b06000", bgLight: "#fef7e0" },
  { color: "#137333", bgLight: "#e6f4ea" },
];

function FinaleCard({ round }: { round: LandingFinalRound }) {
  return (
    <article
      className="landing-finale-card flex items-start gap-6 rounded-[40px] border border-l-4 bg-white/85 px-9 py-[33.8px] shadow-[0_20px_40px_0_rgba(66,133,244,0.08)] backdrop-blur-lg transition duration-300 hover:-translate-y-1"
      style={{
        borderLeftColor: round.color,
        borderTopColor: round.color,
        borderRightColor: round.color,
        borderBottomColor: round.color,
      }}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner"
        style={{ background: round.iconBg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={round.iconSrc} className="h-5 w-5 object-contain" />
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <p className="display m-0 text-xl font-bold leading-[30px] text-[#1c1b1b]">{round.title}</p>
        <p className="m-0 text-justify text-sm leading-5 text-[#424753]">{round.body}</p>
      </div>
    </article>
  );
}

export function LandingFinalSection({
  finalRoundTitle,
  finalRounds,
  criteria,
}: {
  finalRoundTitle: string;
  finalRounds: LandingFinalRound[];
  criteria: LandingCriterion[];
}) {
  const topRow = finalRounds.slice(0, 2);
  const bottomRow = finalRounds.slice(2, 4);

  return (
    <section id="tieu-chi" className="relative z-[1] scroll-mt-24 px-5 py-11 md:px-[clamp(16px,5.2vw,80px)] md:pb-20">
      <div className="mx-auto max-w-[1368px]">
        <h2 className="display mb-12 text-center text-[clamp(18px,2.6vw,40px)] font-bold leading-[56px] tracking-[-0.56px] text-[#424753]">
          {finalRoundTitle}
        </h2>

        <div className="landing-finale-grid mb-6 grid gap-6 md:grid-cols-2">
          {topRow.map((round) => (
            <FinaleCard key={round.title} round={round} />
          ))}
        </div>
        <div className="landing-finale-grid mb-[72px] grid gap-6 md:grid-cols-2">
          {bottomRow.map((round) => (
            <FinaleCard key={round.title} round={round} />
          ))}
        </div>

        <h3 className="display mb-8 text-center text-[clamp(18px,2.1vw,32px)] font-bold leading-[56px] tracking-[-0.56px] text-[#424753]">
          Cách tính điểm
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          {criteria.map((criterion, index) => {
            const accent = CRITERIA_ACCENTS[index % CRITERIA_ACCENTS.length];
            const color = criterion.color || accent.color;
            const bgLight = criterion.bgLight || accent.bgLight;
            return (
              <article
                key={criterion.id}
                className="flex flex-col gap-3 rounded-3xl border border-black/[0.08] border-t-4 bg-white/85 px-6 py-7 shadow-[0_10px_30px_0_rgba(66,133,244,0.06)] backdrop-blur-lg"
                style={{ borderTopColor: color }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="display text-lg font-bold text-[#1c1b1b]">{criterion.title}</h4>
                  <span
                    className="display rounded-2xl px-3 py-1 text-base font-extrabold"
                    style={{ color, background: bgLight }}
                  >
                    {criterion.weight}%
                  </span>
                </div>
                <p className="m-0 text-justify text-sm leading-[22px] text-[#424753]">{criterion.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const DEFAULT_FINAL_ROUNDS: LandingFinalRound[] = [
  {
    title: "The Sprint",
    color: "#4285f4",
    iconBg: "#e8f0fe",
    iconSrc: LANDING_ASSETS.iconSprint,
    body:
      "Hai đội đối đầu nhận cùng một bài toán thực tế. Trong vòng 5 phút, các đội tiến hành xây dựng bản thử nghiệm (Proof of Concept) trên Gemini và Google AI Studio, tập trung chứng minh tính khả thi mà không yêu cầu dựng hệ thống backend hoàn chỉnh.",
  },
  {
    title: "The Pitch",
    color: "#f4b400",
    iconBg: "#fef7e0",
    iconSrc: LANDING_ASSETS.iconPitch,
    body:
      "Mỗi đội có 60 giây để trình bày ngắn gọn về bài toán, giải pháp ứng dụng AI và demo sản phẩm trực tiếp trước Ban giám khảo và khán giả.",
  },
  {
    title: "The Verdict",
    color: "#db4437",
    iconBg: "#fce8e6",
    iconSrc: LANDING_ASSETS.iconVerdict,
    body:
      "Mỗi thành viên Ban giám khảo đặt tối đa một câu hỏi chất vấn. Sau đó, Hội đồng giám khảo chấm điểm, đánh giá và quyết định đội thi đi tiếp.",
  },
  {
    title: "On-stage Twist",
    color: "#0f9d58",
    iconBg: "#e6f4ea",
    iconSrc: LANDING_ASSETS.iconTwist,
    body:
      "Các thử thách bất ngờ có thể xuất hiện ngay trên sân khấu nhằm thử thách khả năng ứng biến linh hoạt của thí sinh.",
  },
];
