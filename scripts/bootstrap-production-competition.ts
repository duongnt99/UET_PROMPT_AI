/**
 * Bootstrap production competition record (no demo users).
 * Safe to run on production — idempotent upsert by slug.
 *
 * Usage:
 *   pnpm exec tsx scripts/bootstrap-production-competition.ts
 */
import "dotenv/config";
import { fromZonedTime } from "date-fns-tz";
import { PrismaClient } from "@prisma/client";
import { defaultCompetitionSettings } from "../src/config/competition-settings";

const prisma = new PrismaClient();
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

function zonedDate(year: number, month: number, day: number) {
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`;
  return fromZonedTime(iso, APP_TIMEZONE);
}

async function ensureRubrics(competitionId: string) {
  for (const [stage, name] of [
    ["AUDITION", "Audition Rubric v1"],
    ["FINAL", "Final Rubric v1"],
  ] as const) {
    const existing = await prisma.rubric.findFirst({
      where: { competitionId, stage },
    });
    if (existing) continue;
    await prisma.rubric.create({
      data: {
        competitionId,
        stage,
        name,
        versionNumber: 1,
        isActive: true,
        criteria: {
          create: [
            {
              code: "FEASIBILITY",
              titleVi: "Tính khả thi",
              titleEn: "Feasibility",
              description:
                "Mức độ hoạt động của sản phẩm; tính hoàn thiện; khả năng sử dụng và trải nghiệm.",
              weight: 40,
              minScore: 0,
              maxScore: 10,
              scoreStep: 0.5,
              guidance: "Ưu tiên sản phẩm chạy được, có luồng người dùng rõ.",
              displayOrder: 1,
              isRequired: true,
            },
            {
              code: "CREATIVITY",
              titleVi: "Tính sáng tạo",
              titleEn: "Creativity",
              description: "Tính mới của ý tưởng và cách khai thác AI.",
              weight: 30,
              minScore: 0,
              maxScore: 10,
              scoreStep: 0.5,
              guidance: "Đánh giá mức độ vượt khỏi mẫu giải pháp đơn giản.",
              displayOrder: 2,
              isRequired: true,
            },
            {
              code: "POTENTIAL_IMPACT",
              titleVi: "Tiềm năng tác động",
              titleEn: "Potential Impact",
              description: "Mức độ giải quyết đúng bài toán và khả năng mở rộng.",
              weight: 30,
              minScore: 0,
              maxScore: 10,
              scoreStep: 0.5,
              guidance: "Cân nhắc giá trị xã hội/thị trường và hướng phát triển tiếp.",
              displayOrder: 3,
              isRequired: true,
            },
          ],
        },
      },
    });
  }
}

async function ensureFaqs(competitionId: string) {
  const faqs = [
    {
      order: 1,
      question: "Chi phí tham dự Chung kết cho các thí sinh như thế nào?",
      answer:
        "Ban Tổ chức sẽ công bố chính sách hỗ trợ thí sinh Chung kết trong thông báo chính thức.",
    },
    {
      order: 2,
      question: "Thí sinh được cung cấp tài khoản AI như thế nào?",
      answer: "Các đội được lựa chọn vào vòng chung kết sẽ được cấp tài khoản Google AI Pro.",
    },
    {
      order: 3,
      question: "Bản quyền sản phẩm thuộc về ai?",
      answer: "Thí sinh chịu trách nhiệm về sản phẩm và nguồn nội dung sử dụng trong bài dự thi.",
    },
    {
      order: 4,
      question: "Phương thức nhập lệnh (Prompting) được quy định ra sao?",
      answer: "Thí sinh thực hiện nhập lệnh trực tiếp theo thể lệ và yêu cầu của từng phần thi.",
    },
    {
      order: 5,
      question: "Ngôn ngữ chính thức được sử dụng trong cuộc thi là gì?",
      answer: "Ngôn ngữ chính thức của cuộc thi là tiếng Việt.",
    },
  ];
  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({
      where: { competitionId, question: faq.question },
    });
    if (existing) continue;
    await prisma.fAQ.create({
      data: {
        competitionId,
        question: faq.question,
        answerMarkdown: faq.answer,
        displayOrder: faq.order,
        status: "PUBLISHED",
      },
    });
  }
}

async function ensureTimeline(competitionId: string) {
  const items = [
    {
      order: 1,
      title: "Phát động & mở đơn",
      description:
        "Phát động cuộc thi và chính thức mở cổng đăng ký tham gia trực tuyến cho các đội thi trên toàn quốc.",
      startAt: zonedDate(2026, 9, 15),
      endAt: null,
      statusLabel: "Dự kiến",
    },
    {
      order: 2,
      title: "Vòng tuyển chọn",
      description:
        "• Đăng ký trực tuyến trên website.\n• Nộp video & thử thách vibe coding với Google Gemini và Google AI Studio.\n• Top 8 đội xuất sắc nhất tiến vào Chung kết.",
      startAt: zonedDate(2026, 9, 15),
      endAt: zonedDate(2026, 10, 5),
      statusLabel: "Audition",
    },
    {
      order: 3,
      title: "Đánh giá & chọn đội",
      description: "Hội đồng Giám khảo chấm, rà soát và lựa chọn đội vào chung kết.",
      startAt: zonedDate(2026, 10, 6),
      endAt: zonedDate(2026, 10, 14),
      statusLabel: "Đánh giá",
    },
    {
      order: 4,
      title: "Công bố danh sách vòng chung kết",
      description: "Công bố 8 đội thi xuất sắc bước vào vòng chung kết.",
      startAt: zonedDate(2026, 10, 15),
      endAt: null,
      statusLabel: "Công bố",
    },
    {
      order: 5,
      title: "Chung kết & trao giải",
      description:
        "• Địa điểm: Hội trường tầng 1, Trung tâm Văn hóa ULIS - Jonathan KS. Choi, ĐHQGHN (144 Xuân Thủy, Cầu Giấy, Hà Nội).\n• 8 đội sẽ tranh tài trực tiếp.",
      startAt: zonedDate(2026, 11, 3),
      endAt: null,
      statusLabel: "Chung kết",
    },
  ];

  for (const item of items) {
    const existing = await prisma.timelineItem.findFirst({
      where: { competitionId, title: item.title },
    });
    if (existing) continue;
    await prisma.timelineItem.create({
      data: {
        competitionId,
        title: item.title,
        description: item.description,
        startAt: item.startAt,
        endAt: item.endAt,
        statusLabel: item.statusLabel,
        displayOrder: item.order,
        status: "PUBLISHED",
      },
    });
  }
}

async function ensureStaticPages(competitionId: string) {
  const pages: { slug: string; title: string; bodyMarkdown: string }[] = [
    {
      slug: "gioi-thieu",
      title: "Giới thiệu",
      bodyMarkdown:
        "AI Arena Vietnam là sân chơi để sinh viên ứng dụng kỹ năng đặt câu lệnh với **Google Gemini** và **Google AI Studio**. Chung kết gồm **8 đội**, thi đấu loại trực tiếp tại ĐHQGHN.",
    },
    {
      slug: "the-le",
      title: "Thể lệ",
      bodyMarkdown: [
        "Khung thể lệ theo họp 24/08/2026 (chưa thay thế văn bản pháp lý chính thức):",
        "",
        "- Chung kết: **8 đội**, tối đa 3 vòng (8 → 4 → 2), đấu trực tiếp, **không miễn đấu (bye)**.",
        "- Công cụ: **Gemini** và **Google AI Studio**. Không dùng công cụ AI cạnh tranh.",
        "- The Sprint: **5 phút** (có thể thử 10 phút). Kết quả kỳ vọng là **proof of concept/demo**, không cần backend hay người dùng thật.",
        "- The Pitch: **60 giây**. Mỗi giám khảo hỏi tối đa một câu.",
        "- Sự kiện chung kết trong **nửa ngày**, chủ yếu bằng tiếng Việt.",
        "- Audition: sinh viên dùng Gemini / Google AI Studio (Google AI Plus). 8 đội chung kết được cấp Google AI Pro.",
      ].join("\n"),
    },
    {
      slug: "huong-dan-audition",
      title: "Hướng dẫn Audition",
      bodyMarkdown:
        "Bài Audition gồm video giới thiệu ngắn và/hoặc thử thách vibe coding với **Gemini** và **Google AI Studio**. Kết quả kỳ vọng là proof of concept, không bắt buộc backend. Các trường bắt buộc do hệ thống cấu hình.",
    },
    {
      slug: "tieu-chi-cham",
      title: "Tiêu chí chấm điểm",
      bodyMarkdown: "Ban Tổ chức có thể phát hành phiên bản rubric mới.",
    },
    {
      slug: "lien-he",
      title: "Liên hệ",
      bodyMarkdown:
        "Đầu mối hệ thống: Ban Tổ chức AI Arena Vietnam — Trường Đại học Công nghệ, ĐHQGHN.",
    },
    {
      slug: "chinh-sach-bao-mat",
      title: "Chính sách bảo mật",
      bodyMarkdown:
        "Hệ thống chỉ thu thập dữ liệu cần thiết cho đăng ký và vận hành cuộc thi. Không thu thập căn cước công dân nếu BTC chưa yêu cầu.",
    },
    {
      slug: "dieu-khoan",
      title: "Điều khoản",
      bodyMarkdown:
        "Khi đăng ký, thí sinh cam kết thông tin trung thực và tuân thủ thể lệ do Ban Tổ chức công bố.",
    },
  ];

  for (const page of pages) {
    const existing = await prisma.staticPage.findFirst({
      where: { competitionId, slug: page.slug },
    });
    if (existing) continue;
    await prisma.staticPage.create({
      data: {
        competitionId,
        slug: page.slug,
        title: page.title,
        bodyMarkdown: page.bodyMarkdown,
        status: "PUBLISHED",
      },
    });
  }
}

async function main() {
  const settings = defaultCompetitionSettings({
    officialContactEmail: "ai-arena-vietnam@uet.edu.vn",
    registrationMode: "BOTH",
    registrationEnabled: true,
    submissionEnabled: true,
    publicScoreboardEnabled: true,
    livestreamEnabled: false,
  });

  const competition = await prisma.competition.upsert({
    where: { slug: settings.competitionSlug },
    update: {
      name: settings.competitionName,
      season: settings.season,
      publicStatus: "PUBLISHED",
      isRehearsal: false,
      // Never overwrite admin-edited settings on re-run.
    },
    create: {
      name: settings.competitionName,
      slug: settings.competitionSlug,
      season: settings.season,
      isRehearsal: false,
      publicStatus: "PUBLISHED",
      settings,
    },
  });

  await ensureRubrics(competition.id);
  await ensureFaqs(competition.id);
  await ensureStaticPages(competition.id);
  await ensureTimeline(competition.id);

  console.info("Production competition ready:", competition.slug, competition.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
