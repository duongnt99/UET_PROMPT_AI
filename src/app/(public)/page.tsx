import { LandingBackground } from "@/components/public/landing/landing-background";
import {
  LandingFinalSection,
  type LandingCriterion,
  type LandingFinalRound,
} from "@/components/public/landing/landing-final-section";
import { DEFAULT_FAQ_ITEMS, LandingFaq } from "@/components/public/landing/landing-faq";
import { LandingHero } from "@/components/public/landing/landing-hero";
import { LandingOrganizers } from "@/components/public/landing/landing-organizers";
import { LandingPrizeSection } from "@/components/public/landing/landing-prize-section";
import { LandingResources } from "@/components/public/landing/landing-resources";
import { LandingTimeline, type LandingTimelineItem } from "@/components/public/landing/landing-timeline";
import { LANDING_ASSETS } from "@/config/landing-assets";
import { landingResourcesFromSettings } from "@/config/landing-resources";
import { formatDurationLabel } from "@/server/domain/match-setup";
import { getPublicHomeData } from "@/server/services/content-service";
import { formatDate } from "@/lib/dates";

const FALLBACK_TIMELINE: LandingTimelineItem[] = [
  {
    id: "launch",
    dateLabel: "15/09/2026",
    title: "PHÁT ĐỘNG & MỞ ĐƠN",
    description:
      "Phát động cuộc thi và mở cổng đăng ký tham gia trực tuyến cho các sinh viên trên toàn quốc.",
  },
  {
    id: "audition",
    dateLabel: "15/09 – 05/10/2026",
    title: "VÒNG TUYỂN CHỌN",
    description:
      "• Đăng ký trực tuyến trên website.\n• Nộp video & thử thách vibe coding với **Google Gemini và Google AI Studio**.\n• **Top 8 đội xuất sắc nhất** tiến vào Chung kết.",
  },
  {
    id: "finalists",
    dateLabel: "06/10 – 14/10/2026",
    title: "CÔNG BỐ DANH SÁCH CÁC ĐỘI VÀO VÒNG CHUNG KẾT",
    description: "Công bố 8 đội thi xuất sắc vào vòng Chung kết",
  },
  {
    id: "final",
    dateLabel: "03/11/2026",
    title: "CHUNG KẾT & TRAO GIẢI",
    description:
      "• **Địa điểm:** Đại học Quốc gia Hà Nội\n  (144 Xuân Thủy, Cầu Giấy, Hà Nội)\n• 8 đội sẽ tranh tài trực tiếp",
  },
];

const FALLBACK_CRITERIA: LandingCriterion[] = [
  {
    id: "kha-thi",
    weight: "40",
    title: "Tính khả thi",
    description: "Mức độ hoạt động của sản phẩm; tính hoàn thiện; khả năng sử dụng và trải nghiệm.",
    color: "#1a73e8",
    bgLight: "#e8f0fe",
  },
  {
    id: "sang-tao",
    weight: "30",
    title: "Tính sáng tạo",
    description: "Tính mới của ý tưởng và cách khai thác AI.",
    color: "#b06000",
    bgLight: "#fef7e0",
  },
  {
    id: "tac-dong",
    weight: "30",
    title: "Tiềm năng tác động",
    description: "Mức độ giải quyết đúng bài toán và khả năng mở rộng.",
    color: "#137333",
    bgLight: "#e6f4ea",
  },
];

function withDuration(template: string, seconds: number) {
  return template.replaceAll("{thoi_luong}", formatDurationLabel(seconds));
}

export default async function HomePage() {
  const data = await getPublicHomeData();
  const settings = data?.competition.settings;

  const rubricCriteria = (data?.rubric?.criteria ?? []).map((criterion, index) => {
    const fallback = FALLBACK_CRITERIA[index % FALLBACK_CRITERIA.length];
    return {
      id: criterion.id,
      weight: criterion.weight.toString(),
      title: criterion.titleVi,
      description: criterion.description,
      color: fallback.color,
      bgLight: fallback.bgLight,
    };
  });
  const criteria = rubricCriteria.length > 0 ? rubricCriteria : FALLBACK_CRITERIA;

  const storedTimeline = data?.timeline ?? [];
  const timeline: LandingTimelineItem[] =
    storedTimeline.length > 0
      ? storedTimeline.map((item) => ({
          id: item.id,
          dateLabel: item.startAt
            ? item.endAt
              ? `${formatDate(item.startAt)} – ${formatDate(item.endAt)}`
              : formatDate(item.startAt)
            : item.statusLabel,
          title: item.title.toUpperCase(),
          description: item.description,
        }))
      : FALLBACK_TIMELINE;

  const faqItems =
    data?.faqs?.length
      ? data.faqs.map((faq) => ({
          id: faq.id,
          question: faq.question,
          answerMarkdown: faq.answerMarkdown,
        }))
      : DEFAULT_FAQ_ITEMS;

  const resourcesContent = settings
    ? landingResourcesFromSettings(settings)
    : landingResourcesFromSettings({
        landingResourcesTitle: "",
        landingResourcesFeaturedBadge: "",
        landingResourcesFeaturedTitle: "",
        landingResourcesFeaturedDescription: "",
        landingResourcesHandbookUrl: "",
        landingResourcesGuideUrl: "",
        landingResourcesGridTitle: "",
        landingResourcesGridDescription: "",
        landingResourceLinks: [],
      });

  const finalRounds: LandingFinalRound[] = [
    {
      title: settings?.finalRoundSprintTitle ?? "The Sprint",
      color: "#4285f4",
      iconBg: "#e8f0fe",
      iconSrc: LANDING_ASSETS.iconSprint,
      body: withDuration(
        settings?.finalRoundSprintDescription ??
          "Hai đội đối đầu nhận cùng một bài toán thực tế. Trong vòng {thoi_luong}, các đội tiến hành xây dựng bản thử nghiệm (Proof of Concept) trên Gemini và Google AI Studio, tập trung chứng minh tính khả thi mà không yêu cầu dựng hệ thống backend hoàn chỉnh.",
        settings?.sprintDurationSeconds ?? 300,
      ),
    },
    {
      title: settings?.finalRoundPitchTitle ?? "The Pitch",
      color: "#f4b400",
      iconBg: "#fef7e0",
      iconSrc: LANDING_ASSETS.iconPitch,
      body: withDuration(
        settings?.finalRoundPitchDescription ??
          "Mỗi đội có {thoi_luong} để trình bày ngắn gọn về bài toán, giải pháp ứng dụng AI và demo sản phẩm trực tiếp trước Ban giám khảo và khán giả.",
        settings?.pitchDurationSeconds ?? 60,
      ),
    },
    {
      title: settings?.finalRoundVerdictTitle ?? "The Verdict",
      color: "#db4437",
      iconBg: "#fce8e6",
      iconSrc: LANDING_ASSETS.iconVerdict,
      body: withDuration(
        settings?.finalRoundVerdictDescription ??
          "Mỗi thành viên Ban giám khảo đặt tối đa một câu hỏi chất vấn. Sau đó, Hội đồng giám khảo chấm điểm, đánh giá và quyết định đội thi đi tiếp.",
        settings?.verdictDurationSeconds ?? 180,
      ),
    },
    {
      title: settings?.finalRoundTwistTitle ?? "On-stage Twist",
      color: "#0f9d58",
      iconBg: "#e6f4ea",
      iconSrc: LANDING_ASSETS.iconTwist,
      body:
        settings?.finalRoundTwistDescription ??
        "Các thử thách bất ngờ có thể xuất hiện ngay trên sân khấu nhằm thử thách khả năng ứng biến linh hoạt của thí sinh.",
    },
  ];

  return (
    <div className="landing-shell relative isolate min-h-screen overflow-hidden bg-[#fcf9f8]">
      <LandingBackground />
      <div className="relative z-10">
        <LandingHero />
        <LandingTimeline items={timeline} />
        <LandingFinalSection
          finalRoundTitle={settings?.landingFinalRoundTitle ?? "Thể thức vòng chung kết"}
          finalRounds={finalRounds}
          criteria={criteria}
        />
        <LandingPrizeSection />
        <LandingResources content={resourcesContent} />
        <LandingFaq items={faqItems} />
        <LandingOrganizers />
      </div>
    </div>
  );
}
