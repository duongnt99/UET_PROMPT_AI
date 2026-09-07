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
    description: "Phát động cuộc thi và chính thức mở cổng đăng ký tham gia trực tuyến cho sinh viên toàn quốc.",
  },
  {
    id: "audition",
    dateLabel: "15/09 – 05/10/2026",
    statusLabel: "Audition",
    title: "Vòng tuyển chọn",
    description: "Đăng ký trực tuyến, nộp video và thử thách vibe coding với Google Gemini và Google AI Studio.",
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
    dateLabel: "01/11/2026",
    statusLabel: "Final day",
    title: "Chung kết & trao giải",
    description: "8 đội thi đấu loại trực tiếp 8 → 4 → 2, không bye, trong sự kiện nửa ngày tại ĐHQGHN.",
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
    question: "Tham gia cuộc thi có mất phí không?",
    answerMarkdown: "Cuộc thi không thu phí tham dự. Thí sinh chỉ cần hoàn thành đăng ký và bài Audition đúng hạn.",
  },
  {
    id: "team",
    question: "Thi cá nhân hay bắt buộc phải có đội?",
    answerMarkdown: "Cổng hiện hỗ trợ đăng ký cá nhân hoặc theo đội theo cấu hình của Ban Tổ chức.",
  },
  {
    id: "copyright",
    question: "Bản quyền sản phẩm thuộc về ai?",
    answerMarkdown: "Thí sinh chịu trách nhiệm về sản phẩm và nguồn nội dung sử dụng trong bài dự thi.",
  },
  {
    id: "tools",
    question: "Dùng công cụ AI nào?",
    answerMarkdown: "Công cụ chính thức là Google Gemini và Google AI Studio.",
  },
  {
    id: "format",
    question: "Thể thức chung kết thế nào?",
    answerMarkdown: "8 đội thi đấu loại trực tiếp qua The Sprint, The Pitch và The Verdict.",
  },
];

function withDuration(template: string, seconds: number) {
  return template.replaceAll("{thoi_luong}", formatDurationLabel(seconds));
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
    <div className="overflow-hidden bg-[#FFFAF8]">
      <section className="landing-grid relative overflow-hidden border-b border-slate-100 text-slate-900">
        <div className="pointer-events-none absolute -left-8 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-[#EA4335]/70 text-white shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="relative mx-auto grid min-h-[620px] max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/85 px-3 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
              <Image src="/partners/vnu-mini.png" alt="Đại học Quốc gia Hà Nội" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="text-slate-300">+</span>
              <Image src="/partners/google-wordmark.png" alt="Google" width={72} height={25} className="h-5 w-auto object-contain" />
              <span className="text-slate-300">+</span>
              <Image src="/partners/uet-mini.jpg" alt="Trường Đại học Công nghệ" width={28} height={28} className="h-7 w-7 rounded-full object-contain" />
            </div>
            <h1 className="display mt-7 text-[2.75rem] font-bold leading-[0.98] tracking-[-0.055em] text-[#17181c] sm:text-6xl lg:text-[4.6rem]">
              {settings?.landingHeroTitle ?? "Prompt-Off:"}
              <span className="mt-2 block text-[#4285F4]">
                {settings?.landingHeroHighlight ?? "Vietnam 2026"}
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 md:text-[1.05rem]">
              {settings?.shortDescription ??
                "Sân chơi quốc gia để sinh viên thực hành kỹ năng đặt câu lệnh cùng Google Gemini và Google AI Studio, xây dựng ứng dụng trong 5–10 phút."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild className="h-11 rounded-full bg-[#169C55] px-6 text-white shadow-[0_10px_25px_rgba(22,156,85,0.24)] hover:bg-[#128147]">
                <Link href="/dashboard/audition">Nộp dự án vòng 1</Link>
              </Button>
              <Button asChild className="h-11 rounded-full bg-[#E33B43] px-6 text-white shadow-[0_10px_25px_rgba(227,59,67,0.2)] hover:bg-[#c92f37]">
                <Link href="/the-le">Thể lệ</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto min-h-[350px] w-full max-w-[430px] sm:min-h-[420px]">
            <div className="absolute inset-x-5 inset-y-4 rotate-[1.5deg] rounded-[2rem] bg-[#4285F4]/10" />
            <div className="absolute inset-0 rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_28px_60px_rgba(15,23,42,0.18)] backdrop-blur">
              <div className="flex gap-1.5 p-6">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EA4335]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FBBC04]/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34A853]/70" />
              </div>
              <Sparkles className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-[#4285F4]/10" strokeWidth={1.2} />
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

      <section id="gioi-thieu" className="relative scroll-mt-24 px-5 py-20 text-center md:py-28">
        <div className="pointer-events-none absolute right-[7%] top-16 text-[7rem] font-black leading-none text-[#4285F4]/7">◇</div>
        <div className="relative mx-auto max-w-4xl">
          <h2 className="display text-3xl font-bold tracking-[-0.04em] text-[#17181c] md:text-5xl">Thông tin cuộc thi</h2>
          <div className="mx-auto mt-7 max-w-3xl space-y-4 text-left text-base leading-8 text-slate-700">
            {competitionDescription
              .split(/\n\s*\n/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`} className="text-pretty">
                  {paragraph}
                </p>
              ))}
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <p className="bg-[#169C55] px-5 py-2.5 font-semibold text-white">Đối tượng</p>
              <p className="px-5 py-4 text-sm text-slate-600">
                {settings?.landingAudienceText ?? "Sinh viên các trường đại học trên toàn quốc"}
              </p>
            </div>
            <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
              <p className="bg-[#F5AA28] px-5 py-2.5 font-semibold text-white">Công cụ</p>
              <p className="px-5 py-4 text-sm text-slate-600">
                {settings?.landingToolsText ?? "Google AI Studio và Google Gemini"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="lich-trinh" className="scroll-mt-20 px-5 pb-24 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border-2 border-[#4285F4] bg-white px-5 py-1.5 text-sm font-semibold text-[#4285F4] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#4285F4]" />
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
                      "absolute left-3 top-8 h-5 w-5 rounded-full border-[5px] border-[#FFFAF8] shadow-sm md:left-1/2 md:-translate-x-1/2",
                      accent.dot,
                    )}
                  />
                  <article
                    className={cn(
                      "relative rounded-2xl border bg-white/80 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur md:max-w-[390px]",
                      accent.border,
                      isLeft ? "md:col-start-1 md:justify-self-end" : "md:col-start-2",
                    )}
                  >
                    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide", accent.chip)}>
                      {item.dateLabel}
                    </span>
                    <h3 className="mt-3 text-sm font-bold uppercase tracking-[-0.01em] text-slate-900">{item.title}</h3>
                    <FormattedText text={item.description} className="mt-2 text-sm leading-6 text-slate-600" />
                  </article>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-7 hidden h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)] md:flex",
                      accent.icon,
                      isLeft ? "left-[calc(50%+28rem)]" : "right-[calc(50%+28rem)]",
                    )}
                  >
                    <TimelineIcon className="h-5 w-5" />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="px-5 pb-24 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="display text-center text-3xl font-bold tracking-[-0.04em] md:text-5xl">
            {settings?.landingFinalRoundTitle ?? "Vòng chung kết"}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {finalRounds.map((round) => {
              const Icon = round.icon;
              return (
                <article
                  key={round.title}
                  className={cn(
                    "flex gap-4 rounded-2xl border border-slate-100 border-l-[3px] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.1)]",
                    round.accent,
                  )}
                >
                  <span className={cn("flex h-11 w-11 flex-none items-center justify-center rounded-full", round.iconBg)}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{round.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{round.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="tieu-chi" className="scroll-mt-24 px-5 pb-24 md:pb-28">
        <div className="soft-card-glow mx-auto max-w-5xl rounded-[2.5rem] border border-white px-6 py-12 shadow-[0_22px_45px_rgba(15,23,42,0.16)] md:px-12 md:py-16">
          <h2 className="display text-center text-3xl font-bold tracking-[-0.04em] md:text-5xl">
            {criteriaIntro?.title || "Tiêu chí chấm điểm"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-slate-600">
            {criteriaIntro?.bodyMarkdown || "Ban Tổ chức có thể phát hành phiên bản rubric mới."}
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {criteria.map((criterion, index) => {
              const accent = CRITERIA_ACCENTS[index % CRITERIA_ACCENTS.length];
              return (
                <article key={criterion.id} className={cn("rounded-3xl border bg-white/65 px-5 py-7 text-center backdrop-blur", accent.border)}>
                  <p className={cn("display text-4xl font-bold", accent.text)}>{criterion.weight}%</p>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{criterion.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{criterion.description}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-9 flex justify-center">
            <Button asChild className="h-11 rounded-full bg-[#E33B43] px-6 text-white shadow-[0_10px_24px_rgba(227,59,67,0.2)] hover:bg-[#c92f37]">
              <Link href="/tieu-chi-cham">
                Xem chi tiết thể lệ
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 md:pb-28">
        <div className="mx-auto max-w-5xl space-y-20 text-center">
          <div>
            <h2 className="display text-base font-bold uppercase tracking-[0.16em] text-slate-700">Đơn vị đồng tổ chức</h2>
            <OrganizerLogos variant="bare" items={CO_ORGANIZERS} className="mt-10" />
          </div>
          <div>
            <h2 className="display text-base font-bold uppercase tracking-[0.16em] text-slate-700">Đơn vị đăng cai</h2>
            <OrganizerLogos variant="bare" items={HOST_ORGANIZERS} className="mt-8" />
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 px-5 pb-24 md:pb-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="display text-3xl font-bold tracking-[-0.04em] md:text-5xl">Câu hỏi thường gặp</h2>
          <div className="mt-9 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition open:border-[#4285F4]/30 open:shadow-[0_12px_28px_rgba(66,133,244,0.09)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#17406f]">
                  {faq.question}
                  <span aria-hidden className="text-lg leading-none text-[#4285F4] transition group-open:rotate-45">+</span>
                </summary>
                <FormattedText
                  text={faq.answerMarkdown}
                  className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600"
                />
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
