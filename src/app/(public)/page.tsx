import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Code2,
  Gavel,
  Heart,
  Mail,
  Megaphone,
  Rocket,
  Shuffle,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizerLogos } from "@/components/public/organizer-logos";
import { CO_ORGANIZERS, HOST_ORGANIZERS } from "@/config/organizers";
import { formatDurationLabel } from "@/server/domain/match-setup";
import { getPublicHomeData } from "@/server/services/content-service";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { FormattedText } from "@/components/public/formatted-text";

const TIMELINE_ACCENTS = [
  {
    dot: "bg-[#4285F4]",
    border: "border-[#4285F4]/55",
    chip: "border-[#4285F4]/25 bg-[#4285F4]/8 text-[#2565c7]",
    icon: "border-[#4285F4]/30 text-[#4285F4]",
  },
  {
    dot: "bg-[#EA4335]",
    border: "border-[#EA4335]/55",
    chip: "border-[#EA4335]/25 bg-[#EA4335]/8 text-[#bd3027]",
    icon: "border-[#EA4335]/30 text-[#EA4335]",
  },
  {
    dot: "bg-[#FBBC04]",
    border: "border-[#FBBC04]/70",
    chip: "border-[#FBBC04]/35 bg-[#FBBC04]/10 text-[#9a6b00]",
    icon: "border-[#FBBC04]/40 text-[#c98c00]",
  },
  {
    dot: "bg-[#FBBC04]",
    border: "border-[#FBBC04]/70",
    chip: "border-[#FBBC04]/35 bg-[#FBBC04]/10 text-[#9a6b00]",
    icon: "border-[#FBBC04]/40 text-[#c98c00]",
  },
  {
    dot: "bg-[#34A853]",
    border: "border-[#34A853]/60",
    chip: "border-[#34A853]/25 bg-[#34A853]/8 text-[#19783a]",
    icon: "border-[#34A853]/30 text-[#249347]",
  },
];

const TIMELINE_ICONS = [Rocket, Code2, ClipboardCheck, Mail, Trophy];

const FALLBACK_TIMELINE = [
  {
    id: "launch",
    dateLabel: "15/09/2026",
    statusLabel: "Dự kiến",
    title: "Phát động & mở đơn",
    description: "Phát động cuộc thi và chính thức mở cổng đăng ký tham gia trực tuyến cho các đội thi trên toàn quốc.",
  },
  {
    id: "audition",
    dateLabel: "15/09 – 05/10/2026",
    statusLabel: "Audition",
    title: "Vòng tuyển chọn",
    description:
      "• Đăng ký trực tuyến trên website.\n• Nộp video & thử thách vibe coding với Google Gemini và Google AI Studio.\n• Top 8 đội xuất sắc nhất tiến vào Chung kết.",
  },
  {
    id: "review",
    dateLabel: "06/10 – 14/10/2026",
    statusLabel: "Đánh giá",
    title: "Đánh giá & chọn đội",
    description: "Hội đồng Giám khảo chấm, rà soát và lựa chọn đội vào chung kết.",
  },
  {
    id: "finalists",
    dateLabel: "15/10/2026",
    statusLabel: "Công bố",
    title: "Công bố danh sách vòng chung kết",
    description: "Công bố 8 đội thi xuất sắc bước vào vòng chung kết.",
  },
  {
    id: "final",
    dateLabel: "03/11/2026",
    statusLabel: "Chung kết",
    title: "Chung kết & trao giải",
    description:
      "• Địa điểm: Hội trường tầng 1, Trung tâm Văn hóa ULIS - Jonathan KS. Choi, ĐHQGHN (144 Xuân Thủy, Cầu Giấy, Hà Nội).\n• 8 đội sẽ tranh tài trực tiếp.",
  },
];

const CRITERIA_ACCENTS = [
  { border: "border-[#4285F4]/65", text: "text-[#4285F4]" },
  { border: "border-[#FBBC04]/80", text: "text-[#E7A214]" },
  { border: "border-[#34A853]/70", text: "text-[#22984A]" },
];

const FALLBACK_CRITERIA = [
  {
    id: "kha-thi",
    weight: "40",
    title: "Tính khả thi",
    description: "Mức độ hoạt động của sản phẩm, tính hoàn thiện và trải nghiệm sử dụng.",
  },
  {
    id: "sang-tao",
    weight: "30",
    title: "Tính sáng tạo",
    description: "Tính mới của ý tưởng và cách khai thác AI.",
  },
  {
    id: "tac-dong",
    weight: "30",
    title: "Tiềm năng tác động",
    description: "Mức độ giải quyết đúng bài toán và khả năng mở rộng.",
  },
];

const FALLBACK_FAQS = [
  {
    id: "fee",
    question: "Chi phí tham dự Chung kết cho các thí sinh như thế nào?",
    answerMarkdown: "Ban Tổ chức sẽ công bố chính sách hỗ trợ thí sinh Chung kết trong thông báo chính thức.",
  },
  {
    id: "account",
    question: "Thí sinh được cung cấp tài khoản AI như thế nào?",
    answerMarkdown: "Các đội được lựa chọn vào vòng chung kết sẽ được cấp tài khoản Google AI Pro.",
  },
  {
    id: "copyright",
    question: "Bản quyền sản phẩm thuộc về ai?",
    answerMarkdown: "Thí sinh chịu trách nhiệm về sản phẩm và nguồn nội dung sử dụng trong bài dự thi.",
  },
  {
    id: "prompting",
    question: "Phương thức nhập lệnh (Prompting) được quy định ra sao?",
    answerMarkdown: "Thí sinh thực hiện nhập lệnh trực tiếp theo thể lệ và yêu cầu của từng phần thi.",
  },
  {
    id: "language",
    question: "Ngôn ngữ chính thức được sử dụng trong cuộc thi là gì?",
    answerMarkdown: "Ngôn ngữ chính thức của cuộc thi là tiếng Việt.",
  },
];

function withDuration(template: string, seconds: number) {
  return template.replaceAll("{thoi_luong}", formatDurationLabel(seconds));
}

function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div aria-hidden className={cn("h-16 w-full text-white/65 md:h-24", flip && "rotate-180")}>
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="h-full w-full fill-current">
        <path d="M0 32C216 88 421 1 684 34c274 34 474 84 756 18v44H0Z" />
      </svg>
    </div>
  );
}

export default async function HomePage() {
  const data = await getPublicHomeData();
  const settings = data?.competition.settings;
  const competitionDescription =
    settings?.fullDescription ??
    "Cuộc thi công nghệ do Đại học Quốc gia Hà Nội (ĐHQGHN) triển khai, Trường Đại học Công nghệ (VNU-UET) làm đầu mối phối hợp cùng Google tổ chức, mở ra cơ hội thực chiến giải quyết bài toán công nghệ trên nền tảng hai công cụ chính thức là Google Gemini và Google AI Studio.";
  const criteriaIntro = data?.pages.find((page) => page.slug === "tieu-chi-cham");

  const rubricCriteria = (data?.rubric?.criteria ?? []).map((criterion) => ({
    id: criterion.id,
    weight: criterion.weight.toString(),
    title: criterion.titleVi,
    description: criterion.description,
  }));
  const criteria = rubricCriteria.length > 0 ? rubricCriteria : FALLBACK_CRITERIA;

  const storedTimeline = data?.timeline ?? [];
  const timeline =
    storedTimeline.length > 0
      ? storedTimeline.map((item) => ({
          id: item.id,
          dateLabel: item.startAt
            ? item.endAt
              ? `${formatDate(item.startAt)} – ${formatDate(item.endAt)}`
              : formatDate(item.startAt)
            : item.statusLabel,
          statusLabel: item.statusLabel,
          title: item.title,
          description: item.description,
        }))
      : FALLBACK_TIMELINE;
  const faqs = data?.faqs?.length ? data.faqs : FALLBACK_FAQS;

  const finalRounds = [
    {
      title: settings?.finalRoundSprintTitle ?? "The Sprint",
      accent: "border-l-[#4285F4]",
      iconBg: "bg-[#4285F4]/10 text-[#4285F4]",
      icon: Timer,
      body: withDuration(
        settings?.finalRoundSprintDescription ??
          "Hai đội nhận cùng một đề bài, có {thoi_luong} để xây dựng bản thử nghiệm bằng Google Gemini & Google AI Studio — tập trung vào tính khả thi.",
        settings?.sprintDurationSeconds ?? 300,
      ),
    },
    {
      title: settings?.finalRoundPitchTitle ?? "The Pitch",
      accent: "border-l-[#FBBC04]",
      iconBg: "bg-[#FBBC04]/15 text-[#A87400]",
      icon: Megaphone,
      body: withDuration(
        settings?.finalRoundPitchDescription ??
          "Thuyết trình {thoi_luong} theo phong cách YC: bài toán, ứng dụng AI và demo sản phẩm.",
        settings?.pitchDurationSeconds ?? 60,
      ),
    },
    {
      title: settings?.finalRoundVerdictTitle ?? "The Verdict",
      accent: "border-l-[#EA4335]",
      iconBg: "bg-[#EA4335]/10 text-[#D43A2D]",
      icon: Gavel,
      body: withDuration(
        settings?.finalRoundVerdictDescription ?? "Ban Giám khảo chấm điểm, đánh giá và chọn đội đi tiếp.",
        settings?.verdictDurationSeconds ?? 180,
      ),
    },
    {
      title: settings?.finalRoundTwistTitle ?? "On-stage Twist",
      accent: "border-l-[#34A853]",
      iconBg: "bg-[#34A853]/10 text-[#258B43]",
      icon: Shuffle,
      body:
        settings?.finalRoundTwistDescription ??
        "Ban Tổ chức có thể thêm yêu cầu ngay trên sân khấu để thử khả năng ứng biến.",
    },
  ];

  return (
    <div className="landing-shell relative isolate overflow-hidden bg-[#fcf9f8]">
      <div aria-hidden className="landing-page-background pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10">
      <section className="relative overflow-hidden text-slate-900">
        <div className="pointer-events-none absolute -left-8 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-[#EA4335]/70 text-white shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-[5.5rem] lg:gap-16 lg:px-8">
          <div>
            <div className="inline-flex h-[52px] min-w-[269px] items-center justify-center gap-4 rounded-full border border-white/60 bg-white/85 px-3 shadow-sm backdrop-blur-lg">
              <Image src="/partners/vnu-mini.png" alt="Đại học Quốc gia Hà Nội" width={35} height={35} className="h-[35px] w-[35px] object-contain" />
              <span className="text-slate-300">+</span>
              <Image src="/partners/google-wordmark.png" alt="Google" width={90} height={29} className="h-7 w-[90px] object-contain" />
              <span className="text-slate-300">+</span>
              <Image src="/partners/uet-mini.jpg" alt="Trường Đại học Công nghệ" width={42} height={42} className="h-[42px] w-[42px] rounded-full object-contain" />
            </div>
            <h1 className="display mt-7 text-[3rem] font-extrabold leading-[1.03] tracking-[-0.035em] text-[#1c1b1b] sm:text-6xl lg:text-[4.875rem]">
              {settings?.landingHeroTitle ?? "AI Arena"}
              <span className="mt-2 block text-[#4285F4]">
                {settings?.landingHeroHighlight ?? "Vietnam 2026"}
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-justify text-lg leading-8 text-[#424753] md:text-xl">
              {settings?.shortDescription ??
                "Sân chơi quốc gia để sinh viên thực hành kỹ năng đặt câu lệnh cùng Google Gemini và Google AI Studio, xây dựng ứng dụng trong 5–10 phút."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button asChild className="h-13 rounded-full bg-[#0f9d58] px-8 font-extrabold tracking-[0.035em] text-white shadow-md hover:bg-[#0b8248]">
                <Link href="/dashboard/audition">Nộp dự án vòng 1</Link>
              </Button>
              <Button asChild className="h-13 rounded-full bg-[#db4437] px-8 font-bold tracking-[0.035em] text-white shadow-md hover:bg-[#bd352a]">
                <Link href="/the-le">Thể lệ</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto min-h-[350px] w-full max-w-[448px] sm:min-h-[448px]">
            <div className="absolute inset-x-3 inset-y-4 rotate-[1.5deg] rounded-[2.5rem] bg-[#4285F4]/10" />
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/85 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-lg">
              <div className="flex gap-1.5 p-6">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EA4335]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FBBC04]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34A853]/70" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#e8f0fe]/40 via-[#e6f4ea]/20 to-[#fce8e6]/20" />
              <Sparkles className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-[#4285F4]/15" strokeWidth={1.2} />
            </div>
            <span className="absolute -left-5 bottom-14 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4] text-white shadow-lg">
              <Code2 className="h-5 w-5" />
            </span>
            <span className="absolute -right-4 top-20 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#EA4335] shadow-lg ring-1 ring-slate-100">
              <Heart className="h-5 w-5" />
            </span>
            <span className="absolute -bottom-3 left-1/4 flex h-10 w-10 items-center justify-center rounded-full bg-[#34A853] text-white shadow-lg">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
        </div>
      </section>

      <WaveDivider />

      <section id="gioi-thieu" className="relative scroll-mt-24 px-5 pb-20 text-center md:pb-28 lg:px-8">
        <div className="pointer-events-none absolute right-[7%] top-16 text-[7rem] font-black leading-none text-[#4285F4]/7">◇</div>
        <div className="relative mx-auto max-w-7xl">
          <h2 className="display text-3xl font-bold tracking-[-0.025em] text-[#1c1b1b] md:text-[3.5rem] md:leading-[4rem]">Thông tin cuộc thi</h2>
          <FormattedText
            text={competitionDescription}
            className="mx-auto mt-4 max-w-[1000px] text-justify text-lg leading-9 text-[#062f73] md:text-xl [&>p]:text-pretty"
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="relative pt-6">
              <p className="display absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0f9d58] px-6 py-1.5 text-lg font-bold text-white shadow-[0_4px_12px_rgba(15,157,88,0.33)] md:text-[1.375rem]">Đối tượng</p>
              <div className="flex min-h-[142px] items-center justify-center rounded-[2.5rem] border border-[#0f9d58] bg-white/85 px-6 pb-6 pt-11 shadow-[0_20px_40px_-10px_rgba(66,133,244,0.08)] backdrop-blur-lg">
              <p className="text-lg text-[#424753] md:text-xl">
                {settings?.landingAudienceText ?? "Sinh viên các trường đại học trên toàn quốc"}
              </p>
              </div>
            </div>
            <div className="relative pt-6">
              <p className="display absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#f4b400] px-6 py-1.5 text-lg font-bold text-white shadow-[0_4px_12px_rgba(244,180,0,0.33)] md:text-[1.375rem]">Công cụ</p>
              <div className="flex min-h-[142px] items-center justify-center rounded-[2.5rem] border border-[#f4b400] bg-white/85 px-6 pb-6 pt-11 shadow-[0_20px_40px_-10px_rgba(66,133,244,0.08)] backdrop-blur-lg">
              <p className="text-lg text-[#424753] md:text-xl">
                {settings?.landingToolsText ?? "Google AI Studio và Google Gemini"}
              </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="lich-trinh" className="scroll-mt-20 px-5 pb-20 md:pb-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="display mx-auto flex w-fit items-center gap-3 rounded-full border-2 border-[#4285F4] bg-white px-8 py-3 text-lg font-extrabold tracking-[0.065em] text-[#4285F4] shadow-md md:text-[1.375rem]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4285F4]" />
            Lịch trình
          </div>
          <ol className="relative mt-10">
            <span
              aria-hidden
              className="absolute bottom-4 left-[21px] top-4 w-1 rounded-full md:left-1/2 md:-translate-x-1/2"
              style={{ background: "linear-gradient(to bottom, #4285F4 0 21%, #EA4335 21% 42%, #FBBC04 42% 78%, #34A853 78% 100%)" }}
            />
            {timeline.map((item, index) => {
              const accent = TIMELINE_ACCENTS[index % TIMELINE_ACCENTS.length];
              const TimelineIcon = TIMELINE_ICONS[index % TIMELINE_ICONS.length];
              const isLeft = index % 2 === 1;
              return (
                <li key={item.id} className="relative min-h-36 pb-8 pl-14 last:pb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-3 top-8 h-6 w-6 rounded-full border-[5px] border-white shadow-md md:left-1/2 md:-translate-x-1/2",
                      accent.dot,
                    )}
                  />
                  <article
                    className={cn(
                      "relative rounded-2xl border bg-white/85 p-6 shadow-sm backdrop-blur-lg md:w-full md:max-w-[500px]",
                      accent.border,
                      isLeft ? "md:col-start-1 md:justify-self-end" : "md:col-start-2",
                    )}
                  >
                    <span className={cn("display inline-flex rounded-lg border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.05em]", accent.chip)}>
                      {item.dateLabel}
                    </span>
                    <h3 className="display mt-3 text-lg font-extrabold uppercase tracking-[-0.025em] text-slate-800">{item.title}</h3>
                    <FormattedText text={item.description} className="mt-2 text-sm leading-[1.375rem] text-slate-600" />
                  </article>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-6 hidden h-16 w-16 items-center justify-center rounded-2xl border-2 bg-white shadow-lg md:flex",
                      accent.icon,
                      isLeft ? "right-0" : "left-0",
                    )}
                  >
                    <TimelineIcon className="h-8 w-8" />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <WaveDivider flip />

      <section className="px-5 py-16 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="display text-center text-3xl font-bold tracking-[-0.025em] text-[#424753] md:text-[2.5rem] md:leading-[3.5rem]">
            {settings?.landingFinalRoundTitle ?? "Thể thức vòng chung kết"}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {finalRounds.map((round) => {
              const Icon = round.icon;
              return (
                <article
                  key={round.title}
                  className={cn(
                    "flex gap-6 rounded-[2.5rem] border border-l-4 bg-white/85 px-7 py-8 shadow-[0_20px_40px_-10px_rgba(66,133,244,0.08)] backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-10px_rgba(66,133,244,0.14)] md:px-9",
                    round.accent,
                  )}
                >
                  <span className={cn("flex h-14 w-14 flex-none items-center justify-center rounded-full shadow-inner", round.iconBg)}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="display text-xl font-bold text-[#1c1b1b]">{round.title}</h3>
                    <p className="mt-2 text-justify text-sm leading-5 text-[#424753]">{round.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="tieu-chi" className="scroll-mt-24 px-5 pb-20 md:pb-28 lg:px-8">
        <div className="soft-card-glow mx-auto max-w-7xl rounded-[2.5rem] border border-white/60 px-6 py-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-lg md:px-16 md:py-16">
          <h2 className="display text-center text-3xl font-bold tracking-[-0.025em] md:text-[3.5rem] md:leading-[4rem]">
            {criteriaIntro?.title || "Tiêu chí chấm điểm"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-7 text-[#424753] md:text-xl">
            {criteriaIntro?.bodyMarkdown || "Ban Tổ chức có thể phát hành phiên bản rubric mới."}
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {criteria.map((criterion, index) => {
              const accent = CRITERIA_ACCENTS[index % CRITERIA_ACCENTS.length];
              return (
                <article key={criterion.id} className={cn("rounded-[2rem] border bg-white/60 px-8 py-8 text-center shadow-sm backdrop-blur-md", accent.border)}>
                  <p className={cn("display text-5xl font-extrabold", accent.text)}>{criterion.weight}%</p>
                  <h3 className="display mt-4 text-lg font-bold text-[#1c1b1b]">{criterion.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-[#424753]">{criterion.description}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-9 flex justify-center">
            <Button asChild className="h-12 rounded-full bg-[#db4437] px-7 font-semibold tracking-[0.035em] text-white shadow-md hover:bg-[#bd352a]">
              <Link href="/tieu-chi-cham">
                Xem chi tiết thể lệ
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-20 text-center">
          <div>
            <h2 className="display text-lg font-bold uppercase tracking-[0.09em] text-[#424753] md:text-[1.375rem]">Đơn vị đồng tổ chức</h2>
            <OrganizerLogos variant="bare" items={CO_ORGANIZERS} className="mt-12" />
          </div>
          <div>
            <h2 className="display text-lg font-bold uppercase tracking-[0.09em] text-[#424753] md:text-[1.375rem]">Đơn vị đăng cai</h2>
            <OrganizerLogos variant="bare" items={HOST_ORGANIZERS} className="mt-10" />
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 px-5 pb-20 md:pb-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="display text-center text-3xl font-bold tracking-[-0.025em] text-[#1c1b1b] md:text-[3.5rem] md:leading-[4rem]">Câu hỏi thường gặp</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-3xl border border-white/60 bg-white/85 px-6 py-5 shadow-[0_20px_40px_-10px_rgba(66,133,244,0.08)] backdrop-blur-lg transition open:border-[#4285F4]/30 open:shadow-[0_16px_32px_rgba(66,133,244,0.1)]"
              >
                <summary className="display flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold leading-7 text-[#134dab] md:text-lg">
                  {faq.question}
                  <span aria-hidden className="text-lg leading-none text-[#4285F4] transition group-open:rotate-45">+</span>
                </summary>
                <FormattedText
                  text={faq.answerMarkdown}
                  className="mt-4 border-t border-slate-100 pt-4 text-base leading-7 text-slate-600"
                />
              </details>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
