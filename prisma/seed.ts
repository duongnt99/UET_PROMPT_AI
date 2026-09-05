import "dotenv/config";
import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultCompetitionSettings } from "../src/config/competition-settings";
import { ORGANIZERS } from "../src/config/organizers";

const prisma = new PrismaClient();

const password = process.env.SEED_PASSWORD || process.env.ADMIN_SEED_PASSWORD || "DevPassword123!";

async function upsertUser(params: {
  email: string;
  name: string;
  roles: Role[];
  verified?: boolean;
}) {
  const passwordHash = await bcrypt.hash(password, 12);
  const emailNormalized = params.email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { emailNormalized },
    update: {
      name: params.name,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    create: {
      email: params.email,
      emailNormalized,
      name: params.name,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: params.verified === false ? null : new Date(),
      profile: { create: { fullName: params.name, institution: "Đại học Quốc gia Hà Nội" } },
    },
  });
  for (const role of params.roles) {
    const existing = await prisma.roleAssignment.findFirst({
      where: { userId: user.id, role, revokedAt: null },
    });
    if (!existing) {
      await prisma.roleAssignment.create({ data: { userId: user.id, role } });
    }
  }
  return user;
}

async function upsertOrganizers(competitionId: string) {
  const existing = await prisma.partnerAsset.findMany({
    where: { competitionId },
    orderBy: { displayOrder: "asc" },
  });
  for (const [index, organizer] of ORGANIZERS.entries()) {
    const displayOrder = index + 1;
    const match =
      existing.find((item) => item.name === organizer.name) ??
      existing.find((item) => item.displayOrder === displayOrder) ??
      existing[index];
    const data = {
      name: organizer.name,
      imageUrl: organizer.imageUrl,
      href: organizer.href,
      displayOrder,
    };
    if (match) {
      await prisma.partnerAsset.update({ where: { id: match.id }, data });
    } else {
      await prisma.partnerAsset.create({ data: { competitionId, ...data } });
    }
  }
}

async function upsertPublicCopy(competitionId: string) {
  const pages: [string, string, string][] = [
    [
      "gioi-thieu",
      "Giới thiệu",
      "Prompt-Off: Vietnam 2026 là sân chơi để sinh viên ứng dụng prompting với **Gemini** và **Google AI Studio**. Chung kết **8 đội**, loại trực tiếp 8 → 4 → 2, **không bye**, tổ chức trong **nửa ngày** tại ĐHQGHN.",
    ],
    [
      "the-le",
      "Thể lệ",
      [
        "Khung thể lệ theo họp 24/08/2026 (chưa thay thế văn bản pháp lý chính thức):",
        "",
        "- Chung kết: **8 đội**, tối đa 3 vòng (8 → 4 → 2), đấu trực tiếp, **không miễn đấu (bye)**.",
        "- Công cụ: **Gemini** và **Google AI Studio**. Không dùng công cụ AI cạnh tranh.",
        "- The Sprint: **5 phút** (có thể thử 10 phút). Kết quả kỳ vọng là **proof of concept/demo**, không cần backend hay người dùng thật.",
        "- The Pitch: **60 giây**. Mỗi giám khảo hỏi tối đa một câu.",
        "- Sự kiện chung kết trong **nửa ngày**, chủ yếu bằng tiếng Việt.",
        "- Audition: sinh viên dùng Gemini / Google AI Studio (Google AI Plus). 8 đội chung kết được cấp Google AI Pro.",
      ].join("\n"),
    ],
    [
      "huong-dan-audition",
      "Hướng dẫn Audition",
      "Bài Audition gồm video giới thiệu ngắn và/hoặc thử thách vibe coding với **Gemini** và **Google AI Studio**. Kết quả kỳ vọng là proof of concept, không bắt buộc backend. Các trường bắt buộc do hệ thống cấu hình.",
    ],
  ];
  for (const [slug, title, bodyMarkdown] of pages) {
    const existing = await prisma.staticPage.findFirst({ where: { competitionId, slug } });
    if (existing) {
      await prisma.staticPage.update({ where: { id: existing.id }, data: { title, bodyMarkdown, status: "PUBLISHED" } });
    } else {
      await prisma.staticPage.create({
        data: { competitionId, slug, title, bodyMarkdown, status: "PUBLISHED" },
      });
    }
  }
  const legacyFaq = await prisma.fAQ.findFirst({
    where: { competitionId, question: "Có cần tài khoản Gemini API không?" },
  });
  if (legacyFaq) {
    await prisma.fAQ.update({
      where: { id: legacyFaq.id },
      data: {
        question: "Dùng công cụ AI nào?",
        answerMarkdown:
          "Công cụ chính thức là **Gemini** và **Google AI Studio**. Cổng không thu thập API key. Vòng audition dùng Google AI Plus; **8 đội chung kết** được cấp Google AI Pro với hạn mức ngang nhau.",
        displayOrder: 4,
        status: "PUBLISHED",
      },
    });
  }
  const faqs: [string, string, number][] = [
    ["Ai được tham dự?", "Sinh viên các đại học, trường đại học trên toàn quốc.", 1],
    [
      "Thi cá nhân hay theo đội?",
      "Cổng hiện cho phép đăng ký cá nhân hoặc đội. Ban Tổ chức sẽ chốt hình thức bắt buộc trước khi phát động chính thức.",
      2,
    ],
    [
      "Ngày chung kết khi nào?",
      "Dự kiến **01/11/2026** hoặc **03/11/2026**. Chung kết diễn ra trong **nửa ngày**.",
      3,
    ],
    [
      "Dùng công cụ AI nào?",
      "Công cụ chính thức là **Gemini** và **Google AI Studio**. Cổng không thu thập API key. Vòng audition dùng Google AI Plus; **8 đội chung kết** được cấp Google AI Pro với hạn mức ngang nhau.",
      4,
    ],
    [
      "Thể thức chung kết thế nào?",
      "**8 đội**, loại trực tiếp 8 → 4 → 2, **không bye**. The Sprint bắt đầu **5 phút** (có thể thử 10 phút) để dựng proof of concept. The Pitch **60 giây**.",
      5,
    ],
  ];
  for (const [question, answerMarkdown, displayOrder] of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { competitionId, question } });
    if (existing) {
      await prisma.fAQ.update({
        where: { id: existing.id },
        data: { answerMarkdown, displayOrder, status: "PUBLISHED" },
      });
    } else {
      await prisma.fAQ.create({
        data: { competitionId, question, answerMarkdown, displayOrder, status: "PUBLISHED" },
      });
    }
  }
  const finale = await prisma.timelineItem.findFirst({
    where: { competitionId, title: "Chung kết trực tiếp tại ĐHQGHN" },
  });
  if (finale) {
    await prisma.timelineItem.update({
      where: { id: finale.id },
      data: { description: "Dự kiến 01/11 hoặc 03/11/2026. Sự kiện nửa ngày, 8 đội, không bye." },
    });
  }
}

async function upsertSampleChallenge(competitionId: string) {
  const title = "Trợ lý lịch học siêu địa phương";
  const prompt =
    "Trong 5 phút, dựng proof of concept trên Gemini và Google AI Studio giúp sinh viên ĐHQGHN sắp lịch học/thi theo tòa nhà và thời tiết. Không cần backend hay người dùng thật.";
  const existing = await prisma.matchChallenge.findFirst({ where: { competitionId, title } });
  const challenge = existing
    ? await prisma.matchChallenge.update({ where: { id: existing.id }, data: { title, prompt } })
    : await prisma.matchChallenge.create({ data: { competitionId, title, prompt } });
  const empty = await prisma.match.findFirst({
    where: { competitionId, problemTitle: "" },
    orderBy: { code: "asc" },
  });
  if (empty) {
    await prisma.match.update({
      where: { id: empty.id },
      data: {
        challengeId: challenge.id,
        problemTitle: challenge.title,
        problemPrompt: challenge.prompt,
      },
    });
  }
}

async function createRubric(
  competitionId: string,
  stage: "AUDITION" | "FINAL",
  name: string,
) {
  const rubric = await prisma.rubric.create({
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
            description: "Mức độ hoạt động của sản phẩm; tính hoàn thiện; khả năng sử dụng và trải nghiệm.",
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
  return rubric;
}

async function main() {
  console.warn("Seeding development data. Password for all demo accounts:", password);
  const superAdmin = await upsertUser({
    email: process.env.ADMIN_SEED_EMAIL || "superadmin@promptoff.local",
    name: "Super Admin",
    roles: ["SUPER_ADMIN"],
  });
  const admin = await upsertUser({
    email: "admin@promptoff.local",
    name: "Quản trị cuộc thi",
    roles: ["ADMIN"],
  });
  const tech = await upsertUser({
    email: "tech@promptoff.local",
    name: "Kỹ thuật sân khấu",
    roles: ["TECH_OPERATOR"],
  });
  const reviewers = await Promise.all(
    [1, 2, 3].map((n) =>
      upsertUser({
        email: `reviewer${n}@promptoff.local`,
        name: `Reviewer ${n}`,
        roles: ["REVIEWER"],
      }),
    ),
  );
  const judges = await Promise.all(
    [1, 2, 3].map((n) =>
      upsertUser({
        email: `judge${n}@promptoff.local`,
        name: `Giám khảo ${n}`,
        roles: ["JUDGE"],
      }),
    ),
  );

  const settings = defaultCompetitionSettings({
    registrationMode: "BOTH",
    registrationEnabled: true,
    submissionEnabled: true,
    publicScoreboardEnabled: true,
    livestreamEnabled: false,
  });

  const production = await prisma.competition.upsert({
    where: { slug: settings.competitionSlug },
    update: { settings, name: settings.competitionName, publicStatus: "PUBLISHED" },
    create: {
      name: settings.competitionName,
      slug: settings.competitionSlug,
      season: "2026",
      isRehearsal: false,
      publicStatus: "PUBLISHED",
      settings,
    },
  });

  const rehearsalSettings = defaultCompetitionSettings({
    competitionName: "Prompt-Off: Vietnam 2026 (Rehearsal)",
    competitionSlug: "prompt-off-vietnam-2026-rehearsal",
    rehearsalCompetitionId: production.id,
  });
  const rehearsal = await prisma.competition.upsert({
    where: { slug: rehearsalSettings.competitionSlug },
    update: { settings: rehearsalSettings, isRehearsal: true, clonedFromId: production.id },
    create: {
      name: rehearsalSettings.competitionName,
      slug: rehearsalSettings.competitionSlug,
      season: "2026",
      isRehearsal: true,
      clonedFromId: production.id,
      publicStatus: "DRAFT",
      settings: rehearsalSettings,
    },
  });
  await prisma.competition.update({
    where: { id: production.id },
    data: {
      settings: defaultCompetitionSettings({
        ...settings,
        rehearsalCompetitionId: rehearsal.id,
      }),
    },
  });

  const existingRubric = await prisma.rubric.findFirst({
    where: { competitionId: production.id, stage: "AUDITION" },
  });
  if (!existingRubric) {
    await createRubric(production.id, "AUDITION", "Audition Rubric v1");
    await createRubric(production.id, "FINAL", "Final Rubric v1");
    await createRubric(rehearsal.id, "AUDITION", "Audition Rubric rehearsal");
    await createRubric(rehearsal.id, "FINAL", "Final Rubric rehearsal");
  }

  const faqCount = await prisma.fAQ.count({ where: { competitionId: production.id } });
  if (faqCount === 0) {
    await prisma.fAQ.createMany({
      data: [
        {
          competitionId: production.id,
          question: "Ai được tham dự?",
          answerMarkdown: "Sinh viên các đại học, trường đại học trên toàn quốc.",
          displayOrder: 1,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          question: "Thi cá nhân hay theo đội?",
          answerMarkdown:
            "Ban Tổ chức **chưa chốt** hình thức bắt buộc. Cổng hiện cho phép đăng ký cá nhân hoặc đội để Ban Tổ chức có thể điều chỉnh trước khi phát động chính thức.",
          displayOrder: 2,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          question: "Ngày chung kết khi nào?",
          answerMarkdown: "Dự kiến **01/11/2026** hoặc **03/11/2026**, chưa phải ngày chính thức.",
          displayOrder: 3,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          question: "Có cần tài khoản Gemini API không?",
          answerMarkdown:
            "Cổng đăng ký không yêu cầu Gemini API key. Thí sinh mô tả cách dùng Gemini và nộp artifact/link theo hướng dẫn.",
          displayOrder: 4,
          status: "PUBLISHED",
        },
      ],
    });
    await prisma.timelineItem.createMany({
      data: [
        {
          competitionId: production.id,
          title: "Phát động và mở đăng ký",
          description: "Dự kiến 15/09/2026.",
          startAt: new Date("2026-09-15T00:00:00.000Z"),
          statusLabel: "Dự kiến",
          displayOrder: 1,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          title: "Tiếp nhận đăng ký và bài Audition",
          description: "Dự kiến 15/09–05/10/2026.",
          startAt: new Date("2026-09-15T00:00:00.000Z"),
          endAt: new Date("2026-10-05T16:59:59.000Z"),
          statusLabel: "Dự kiến",
          displayOrder: 2,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          title: "Chấm và lựa chọn vào chung kết",
          description: "Dự kiến 06–14/10/2026.",
          statusLabel: "Dự kiến",
          displayOrder: 3,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          title: "Công bố finalist",
          description: "Dự kiến 15/10/2026.",
          statusLabel: "Dự kiến",
          displayOrder: 4,
          status: "PUBLISHED",
        },
        {
          competitionId: production.id,
          title: "Chung kết trực tiếp tại ĐHQGHN",
          description: "Dự kiến 01/11 hoặc 03/11/2026.",
          statusLabel: "Dự kiến",
          displayOrder: 5,
          status: "PUBLISHED",
        },
      ],
    });
    await prisma.announcement.create({
      data: {
        competitionId: production.id,
        title: "Hệ thống đăng ký đang được hoàn thiện",
        slug: "he-thong-dang-ky",
        excerpt: "Cổng thông tin Prompt-Off: Vietnam 2026 đã sẵn sàng cho giai đoạn thử nghiệm nội bộ.",
        bodyMarkdown:
          "Ban Tổ chức đang hoàn thiện thể lệ, rubric và các mốc chính thức. Các thông tin chưa chốt sẽ hiển thị **Đang cập nhật** hoặc **Dự kiến**.",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    const pages = [
      ["gioi-thieu", "Giới thiệu", "Cuộc thi Prompt-Off: Vietnam 2026 tạo sân chơi để sinh viên ứng dụng AI tạo sinh và prompting, phát triển nhanh MVP bằng Gemini."],
      ["the-le", "Thể lệ", "Thể lệ chính thức **đang được Ban Tổ chức hoàn thiện**. Bản này mô tả khung đã công bố trong kế hoạch tổ chức, không tự ý chốt các nội dung còn treo."],
      ["huong-dan-audition", "Hướng dẫn Audition", "Bài Audition gồm video giới thiệu ngắn và/hoặc thử thách vibe coding cơ bản sử dụng Gemini. Các trường bắt buộc được cấu hình trong hệ thống, không hard-code."],
      ["tieu-chi-cham", "Tiêu chí chấm", "Rubric mặc định: Tính khả thi 40%, Tính sáng tạo 30%, Tiềm năng tác động 30%. Ban Tổ chức có thể phát hành phiên bản rubric mới."],
      ["lien-he", "Liên hệ", "Đầu mối hệ thống: Ban Tổ chức Prompt-Off — Trường Đại học Công nghệ, ĐHQGHN."],
      ["chinh-sach-bao-mat", "Chính sách bảo mật", "Hệ thống chỉ thu thập dữ liệu cần thiết cho đăng ký và vận hành cuộc thi. Không thu thập căn cước công dân nếu BTC chưa yêu cầu."],
      ["dieu-khoan", "Điều khoản", "Khi đăng ký, thí sinh cam kết thông tin trung thực và tuân thủ thể lệ do Ban Tổ chức công bố."],
    ];
    for (const [slug, title, bodyMarkdown] of pages) {
      await prisma.staticPage.create({
        data: { competitionId: production.id, slug, title, bodyMarkdown, status: "PUBLISHED" },
      });
    }
  }

  await upsertOrganizers(production.id);
  await upsertPublicCopy(production.id);
  await upsertSampleChallenge(production.id);

  const students = [];
  for (let i = 1; i <= 12; i += 1) {
    students.push(
      await upsertUser({
        email: `student${i}@promptoff.local`,
        name: `Sinh viên ${i}`,
        roles: ["PARTICIPANT"],
      }),
    );
  }

  const hasReg = await prisma.registration.findFirst({ where: { competitionId: production.id } });
  if (!hasReg) {
    for (let i = 0; i < 4; i += 1) {
      const owner = students[i]!;
      await prisma.registration.create({
        data: {
          competitionId: production.id,
          ownerUserId: owner.id,
          type: "INDIVIDUAL",
          code: `PO26-IND${i + 1}`.padEnd(12, "0"),
          status: i === 0 ? "DRAFT" : "SUBMITTED",
          submittedAt: i === 0 ? null : new Date(),
          seats: { create: { userId: owner.id, competitionId: production.id } },
        },
      });
    }
    for (let t = 0; t < 4; t += 1) {
      const leader = students[4 + t]!;
      const member = students[8 + t]!;
      const team = await prisma.team.create({
        data: {
          competitionId: production.id,
          teamName: `Đội Prompt ${t + 1}`,
          teamCode: `TEAM${t + 1}`,
          leaderUserId: leader.id,
          invitationCode: `INVTEAM${t + 1}`,
          status: "ACTIVE",
          shortIntroduction: "Nhóm sinh viên phát triển MVP bằng Gemini.",
          members: {
            create: [
              { userId: leader.id, status: "ACCEPTED", roleLabel: "Nhóm trưởng", joinedAt: new Date() },
              { userId: member.id, status: "ACCEPTED", roleLabel: "Thành viên", joinedAt: new Date() },
            ],
          },
        },
      });
      const registration = await prisma.registration.create({
        data: {
          competitionId: production.id,
          ownerUserId: leader.id,
          teamId: team.id,
          type: "TEAM",
          code: `PO26-TEAM${t + 1}`,
          status: t < 3 ? "SUBMITTED" : "SELECTED",
          submittedAt: new Date(),
          seats: {
            create: [
              { userId: leader.id, competitionId: production.id },
              { userId: member.id, competitionId: production.id },
            ],
          },
        },
      });
      const submission = await prisma.submission.create({
        data: {
          competitionId: production.id,
          registrationId: registration.id,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
      const version = await prisma.submissionVersion.create({
        data: {
          submissionId: submission.id,
          versionNumber: 1,
          submissionTitle: `MVP ${team.teamName}`,
          problemStatement: "Sinh viên cần công cụ hỗ trợ học tập cá nhân hóa.",
          targetUsers: "Sinh viên đại học",
          solutionSummary: "Trợ lý Gemini lập kế hoạch học và phản hồi bài làm.",
          expectedImpact: "Tăng tỷ lệ hoàn thành bài tập.",
          geminiUsageSummary: "Dùng Gemini để sinh lộ trình và phản hồi.",
          promptingProcessSummary: "Lặp prompt, tách vai trò, kiểm tra kết quả.",
          technicalApproach: "Next.js + Gemini.",
          introVideoUrl: "https://example.com/video-placeholder",
          originalityDeclaration: true,
          isImmutable: true,
        },
      });
      await prisma.submission.update({
        where: { id: submission.id },
        data: { currentVersionId: version.id },
      });
    }
  }

  const selectedRegs = await prisma.registration.findMany({
    where: { competitionId: production.id },
    take: 10,
    orderBy: { createdAt: "asc" },
  });
  const finalistCount = await prisma.finalist.count({ where: { competitionId: production.id } });
  if (finalistCount === 0) {
    const createdFinalists: { id: string }[] = [];
    for (const [index, registration] of selectedRegs.entries()) {
      createdFinalists.push(
        await prisma.finalist.create({
          data: {
            competitionId: production.id,
            registrationId: registration.id,
            seed: index + 1,
            displayName: registration.type === "TEAM" ? `Đội ${index + 1}` : `Thí sinh ${index + 1}`,
            institutionPublic: "ĐHQGHN",
            published: true,
            publishedAt: new Date(),
          },
        }),
      );
    }
    while (createdFinalists.length < 10) {
      const nextIndex = createdFinalists.length + 1;
      const extraUser = await upsertUser({
        email: `finalist${nextIndex}@promptoff.local`,
        name: `Finalist ${nextIndex}`,
        roles: ["PARTICIPANT"],
      });
      const extraReg = await prisma.registration.create({
        data: {
          competitionId: production.id,
          ownerUserId: extraUser.id,
          type: "INDIVIDUAL",
          code: `PO26-FIN${nextIndex}`,
          status: "SELECTED",
          submittedAt: new Date(),
          seats: { create: { userId: extraUser.id, competitionId: production.id } },
        },
      });
      createdFinalists.push(
        await prisma.finalist.create({
          data: {
            competitionId: production.id,
            registrationId: extraReg.id,
            seed: createdFinalists.length + 1,
            displayName: extraUser.name ?? `Finalist ${createdFinalists.length + 1}`,
            institutionPublic: "ĐHQGHN",
            published: true,
            publishedAt: new Date(),
          },
        }),
      );
    }

    const playIn = await prisma.finalRound.create({
      data: {
        competitionId: production.id,
        name: "play-in",
        displayName: "Vòng play-in",
        order: 1,
        stageType: "MIXED",
        status: "SCHEDULED",
      },
    });
    const quarter = await prisma.finalRound.create({
      data: {
        competitionId: production.id,
        name: "quarter",
        displayName: "Tứ kết",
        order: 2,
        stageType: "MIXED",
        status: "DRAFT",
      },
    });
    const semi = await prisma.finalRound.create({
      data: {
        competitionId: production.id,
        name: "semi",
        displayName: "Bán kết",
        order: 3,
        stageType: "MIXED",
        status: "DRAFT",
      },
    });
    const finale = await prisma.finalRound.create({
      data: {
        competitionId: production.id,
        name: "final",
        displayName: "Chung kết",
        order: 4,
        stageType: "MIXED",
        status: "DRAFT",
      },
    });

    const f = createdFinalists;
    const qf1 = await prisma.match.create({
      data: { competitionId: production.id, roundId: quarter.id, code: "QF1", status: "DRAFT", competitorAId: f[0]!.id },
    });
    const qf2 = await prisma.match.create({
      data: { competitionId: production.id, roundId: quarter.id, code: "QF2", status: "DRAFT", competitorAId: f[1]!.id },
    });
    const qf3 = await prisma.match.create({
      data: {
        competitionId: production.id,
        roundId: quarter.id,
        code: "QF3",
        status: "DRAFT",
        competitorAId: f[2]!.id,
        competitorBId: f[5]!.id,
      },
    });
    const qf4 = await prisma.match.create({
      data: {
        competitionId: production.id,
        roundId: quarter.id,
        code: "QF4",
        status: "DRAFT",
        competitorAId: f[3]!.id,
        competitorBId: f[4]!.id,
      },
    });
    const pi1 = await prisma.match.create({
      data: {
        competitionId: production.id,
        roundId: playIn.id,
        code: "PI1",
        status: "SCORING",
        competitorAId: f[6]!.id,
        competitorBId: f[9]!.id,
        nextMatchId: qf1.id,
        nextSlot: "B",
        actualStartedAt: new Date(),
      },
    });
    await prisma.match.create({
      data: {
        competitionId: production.id,
        roundId: playIn.id,
        code: "PI2",
        status: "SCHEDULED",
        competitorAId: f[7]!.id,
        competitorBId: f[8]!.id,
        nextMatchId: qf2.id,
        nextSlot: "B",
      },
    });
    const sf1 = await prisma.match.create({
      data: { competitionId: production.id, roundId: semi.id, code: "SF1", status: "DRAFT" },
    });
    const sf2 = await prisma.match.create({
      data: { competitionId: production.id, roundId: semi.id, code: "SF2", status: "DRAFT" },
    });
    const finalMatch = await prisma.match.create({
      data: { competitionId: production.id, roundId: finale.id, code: "FINAL", status: "DRAFT" },
    });
    await prisma.match.update({ where: { id: qf1.id }, data: { nextMatchId: sf1.id, nextSlot: "A" } });
    await prisma.match.update({ where: { id: qf2.id }, data: { nextMatchId: sf1.id, nextSlot: "B" } });
    await prisma.match.update({ where: { id: qf3.id }, data: { nextMatchId: sf2.id, nextSlot: "A" } });
    await prisma.match.update({ where: { id: qf4.id }, data: { nextMatchId: sf2.id, nextSlot: "B" } });
    await prisma.match.update({ where: { id: sf1.id }, data: { nextMatchId: finalMatch.id, nextSlot: "A" } });
    await prisma.match.update({ where: { id: sf2.id }, data: { nextMatchId: finalMatch.id, nextSlot: "B" } });

    await prisma.timerSession.create({
      data: {
        matchId: pi1.id,
        kind: "SPRINT",
        status: "PAUSED",
        durationSeconds: 300,
        remainingSnapshot: 300,
      },
    });
    for (const judge of judges) {
      await prisma.judgeAssignment.create({
        data: { competitionId: production.id, matchId: pi1.id, judgeId: judge.id, status: "ASSIGNED" },
      });
    }
    await prisma.onStageTwist.create({
      data: {
        competitionId: production.id,
        matchId: pi1.id,
        title: "Yêu cầu thêm từ BTC",
        content: "Bổ sung một ràng buộc siêu địa phương do BTC công bố trên sân khấu.",
        status: "READY",
      },
    });
    const challenge = await prisma.matchChallenge.create({
      data: {
        competitionId: production.id,
        title: "Trợ lý lịch học siêu địa phương",
        prompt:
          "Trong 5 phút, dựng proof of concept trên Gemini và Google AI Studio giúp sinh viên ĐHQGHN sắp lịch học/thi theo tòa nhà và thời tiết. Không cần backend hay người dùng thật.",
      },
    });
    await prisma.match.update({
      where: { id: pi1.id },
      data: {
        challengeId: challenge.id,
        problemTitle: challenge.title,
        problemPrompt: challenge.prompt,
      },
    });
  }

  console.info("Seed completed", {
    superAdmin: superAdmin.email,
    admin: admin.email,
    tech: tech.email,
    reviewers: reviewers.map((u) => u.email),
    judges: judges.map((u) => u.email),
    password,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
