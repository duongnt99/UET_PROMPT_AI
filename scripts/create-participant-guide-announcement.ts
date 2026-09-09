/**
 * Create or update the participant onboarding announcement (idempotent by slug).
 *
 * Usage:
 *   pnpm exec tsx scripts/create-participant-guide-announcement.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "huong-dan-dang-ky-va-audition";

const ANNOUNCEMENT = {
  title: "Hướng dẫn đăng ký và nộp bài Audition trên hệ thống",
  slug: SLUG,
  excerpt:
    "Từng bước cho đội thi: đăng nhập, hoàn thiện hồ sơ cá nhân, đăng ký đội, mời thành viên và nộp bài Audition.",
  bodyMarkdown: `Chào các đội thi **AI Arena Vietnam**,

Dưới đây là quy trình sử dụng hệ thống từ lúc có tài khoản đến khi nộp bài **Audition**. Nên làm theo thứ tự để tránh lỗi “chưa được phép nộp bài”.

## Bước 1 — Đăng nhập

- Truy cập https://ai-arena-vietnam.uet.edu.vn/dang-nhap
- Chưa có tài khoản: đăng ký tại https://ai-arena-vietnam.uet.edu.vn/dang-ky
- Sau khi đăng nhập, mở **Bảng điều khiển** (menu **Tổng quan**)

## Bước 2 — Hoàn thiện hồ sơ cá nhân

- Vào **Hồ sơ** (/dashboard/ho-so)
- Điền **họ tên, số điện thoại, trường, khoa/đơn vị, ngành, mã sinh viên, khóa, tỉnh/thành** (các trường bắt buộc theo yêu cầu của Ban Tổ chức)
- Bấm **Lưu hồ sơ** và kiểm tra thông tin vẫn hiển thị đúng sau khi lưu

## Bước 3 — Đăng ký dự thi (cá nhân hoặc đội)

- Vào **Đăng ký** (/dashboard/dang-ky)
- Chọn hình thức **Cá nhân** hoặc **Đội**, nhập **tên đội** (nếu thi theo đội)
- Bấm **Tạo hồ sơ** để tạo hồ sơ nháp

**Nếu thi theo đội:**

- Chỉ **nhóm trưởng** (người tạo hồ sơ) được nộp hồ sơ và nộp bài Audition
- Mời thành viên bằng **email** đã đăng ký trong hệ thống (mục **Mời thành viên** trên trang Đăng ký)
- Thành viên xem lời mời tại **Đội thi** (/dashboard/doi-thi) hoặc **Thông báo** (/dashboard/thong-bao)

**Hoàn tất đăng ký:**

- Tích các ô **đồng ý thể lệ** và **xử lý dữ liệu** (theo form)
- Bấm **Nộp hồ sơ** — hệ thống cấp **mã hồ sơ** khi nộp thành công
- Xem biên nhận tại **Biên nhận** (/dashboard/bien-nhan)

## Bước 4 — Nộp bài Audition

- Chỉ mở sau khi hồ sơ đăng ký đã **nộp thành công**
- Vào **Audition** (/dashboard/audition)
- Điền các mục: **tiêu đề, bài toán, người dùng mục tiêu, tóm tắt giải pháp, tác động, cách dùng Gemini / Google AI Studio, quy trình prompting, hướng kỹ thuật**
- Thêm **URL video giới thiệu, demo, repository** (nếu có)
- Hệ thống **tự lưu** khi bạn rời mỗi ô nhập
- Tích **cam kết bài dự thi nguyên gốc**
- **Nhóm trưởng** bấm **Nộp bài** khi đã hoàn tất — sau khi nộp, bài có thể bị khóa chỉnh sửa tùy cài đặt của Ban Tổ chức

## Tài liệu tham khảo

- Thể lệ: /the-le
- Hướng dẫn Audition: /huong-dan-audition
- Câu hỏi thường gặp: /faq

## Cần hỗ trợ?

- Kiểm tra **Thông báo** trong bảng điều khiển
- Liên hệ Ban Tổ chức qua trang /lien-he

Chúc các đội hoàn thành hồ sơ và bài Audition đúng hạn.`,
};

async function main() {
  const competition = await prisma.competition.findFirst({
    where: { isRehearsal: false, publicStatus: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
  });
  if (!competition) throw new Error("Chưa có cuộc thi production.");

  const publishedAt = new Date();
  const existing = await prisma.announcement.findFirst({
    where: { competitionId: competition.id, slug: SLUG },
  });

  const item = existing
    ? await prisma.announcement.update({
        where: { id: existing.id },
        data: {
          ...ANNOUNCEMENT,
          status: "PUBLISHED",
          publishedAt,
          publishAt: publishedAt,
        },
      })
    : await prisma.announcement.create({
        data: {
          competitionId: competition.id,
          ...ANNOUNCEMENT,
          status: "PUBLISHED",
          publishedAt,
          publishAt: publishedAt,
        },
      });

  console.info("Announcement ready:", item.slug, item.id);
  console.info("Public URL:", `https://ai-arena-vietnam.uet.edu.vn/tin-tuc/${item.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
