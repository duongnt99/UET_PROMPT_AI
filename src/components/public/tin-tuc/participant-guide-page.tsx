import Link from "next/link";
import {
  DocList,
  DocListItem,
  DocParagraph,
  DocSection,
  DocSubsection,
} from "@/components/public/the-le/rules-primitives";

const docLinkClass =
  "font-medium text-[#2565c7] underline decoration-[#4285F4]/40 underline-offset-2 hover:text-[#174b9c]";

export function ParticipantGuidePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <header className="space-y-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#424753]">Đại học Quốc gia Hà Nội</p>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#424753]">Trường Đại học Công nghệ</p>
        <p className="pt-4 text-sm font-bold uppercase tracking-[0.14em] text-[#1c1b1b]">Hướng dẫn thí sinh</p>
        <h1 className="display pt-2 text-3xl font-extrabold text-[#1c1b1b] md:text-4xl">
          Hướng dẫn đăng ký và nộp bài Audition trên hệ thống
        </h1>
        <p className="text-lg font-semibold text-[#424753]">AI Arena Vietnam 2026</p>
      </header>

      <DocParagraph>
        Chào các đội thi <strong className="font-semibold text-[#1c1b1b]">AI Arena Viet Nam</strong>,
      </DocParagraph>
      <DocParagraph>
        Dưới đây là quy trình sử dụng hệ thống từ lúc có tài khoản đến khi nộp bài{" "}
        <strong className="font-semibold text-[#1c1b1b]">Audition</strong>. Nên làm theo thứ tự để tránh lỗi “chưa
        được phép nộp bài”.
      </DocParagraph>

      <div className="mt-10 space-y-10">
        <DocSection title="Bước 1 — Đăng nhập">
          <DocList>
            <DocListItem>
              Truy cập{" "}
              <Link href="/dang-nhap" className={docLinkClass}>
                https://ai-arena-vietnam.uet.edu.vn/dang-nhap
              </Link>
            </DocListItem>
            <DocListItem>
              Chưa có tài khoản: đăng ký tại{" "}
              <Link href="/dang-ky" className={docLinkClass}>
                https://ai-arena-vietnam.uet.edu.vn/dang-ky
              </Link>
            </DocListItem>
            <DocListItem>
              Sau khi đăng nhập, mở <strong className="font-semibold text-[#1c1b1b]">Bảng điều khiển</strong> (menu{" "}
              <strong className="font-semibold text-[#1c1b1b]">Tổng quan</strong>)
            </DocListItem>
          </DocList>
        </DocSection>

        <DocSection title="Bước 2 — Hoàn thiện hồ sơ cá nhân">
          <DocList>
            <DocListItem>
              Vào <strong className="font-semibold text-[#1c1b1b]">Hồ sơ</strong> (
              <Link href="/dashboard/ho-so" className={docLinkClass}>
                /dashboard/ho-so
              </Link>
              )
            </DocListItem>
            <DocListItem>
              Điền{" "}
              <strong className="font-semibold text-[#1c1b1b]">
                họ tên, số điện thoại, trường, khoa/đơn vị, ngành, mã sinh viên, khóa, tỉnh/thành
              </strong>{" "}
              (các trường bắt buộc theo yêu cầu của Ban Tổ chức)
            </DocListItem>
            <DocListItem>
              Bấm <strong className="font-semibold text-[#1c1b1b]">Lưu hồ sơ</strong> và kiểm tra thông tin vẫn hiển
              thị đúng sau khi lưu
            </DocListItem>
          </DocList>
        </DocSection>

        <DocSection title="Bước 3 — Đăng ký dự thi (cá nhân hoặc đội)">
          <DocList>
            <DocListItem>
              Vào <strong className="font-semibold text-[#1c1b1b]">Đăng ký</strong> (
              <Link href="/dashboard/dang-ky" className={docLinkClass}>
                /dashboard/dang-ky
              </Link>
              )
            </DocListItem>
            <DocListItem>
              Chọn hình thức <strong className="font-semibold text-[#1c1b1b]">Cá nhân</strong> hoặc{" "}
              <strong className="font-semibold text-[#1c1b1b]">Đội</strong>, nhập{" "}
              <strong className="font-semibold text-[#1c1b1b]">tên đội</strong> (nếu thi theo đội)
            </DocListItem>
            <DocListItem>
              Bấm <strong className="font-semibold text-[#1c1b1b]">Tạo hồ sơ</strong> để tạo hồ sơ nháp
            </DocListItem>
          </DocList>

          <DocSubsection title="Nếu thi theo đội">
            <DocList>
              <DocListItem>
                Chỉ <strong className="font-semibold text-[#1c1b1b]">nhóm trưởng</strong> (người tạo hồ sơ) được nộp hồ
                sơ và nộp bài Audition
              </DocListItem>
              <DocListItem>
                Mời thành viên bằng <strong className="font-semibold text-[#1c1b1b]">email</strong> đã đăng ký trong hệ
                thống (mục <strong className="font-semibold text-[#1c1b1b]">Mời thành viên</strong> trên trang Đăng ký)
              </DocListItem>
              <DocListItem>
                Thành viên xem lời mời tại <strong className="font-semibold text-[#1c1b1b]">Đội thi</strong> (
                <Link href="/dashboard/doi-thi" className={docLinkClass}>
                  /dashboard/doi-thi
                </Link>
                ) hoặc <strong className="font-semibold text-[#1c1b1b]">Thông báo</strong> (
                <Link href="/dashboard/thong-bao" className={docLinkClass}>
                  /dashboard/thong-bao
                </Link>
                )
              </DocListItem>
            </DocList>
          </DocSubsection>

          <DocSubsection title="Hoàn tất đăng ký">
            <DocList>
              <DocListItem>
                Tích các ô <strong className="font-semibold text-[#1c1b1b]">đồng ý thể lệ</strong> và{" "}
                <strong className="font-semibold text-[#1c1b1b]">xử lý dữ liệu</strong> (theo form)
              </DocListItem>
              <DocListItem>
                Bấm <strong className="font-semibold text-[#1c1b1b]">Nộp hồ sơ</strong> — hệ thống cấp{" "}
                <strong className="font-semibold text-[#1c1b1b]">mã hồ sơ</strong> khi nộp thành công
              </DocListItem>
              <DocListItem>
                Xem biên nhận tại <strong className="font-semibold text-[#1c1b1b]">Biên nhận</strong> (
                <Link href="/dashboard/bien-nhan" className={docLinkClass}>
                  /dashboard/bien-nhan
                </Link>
                )
              </DocListItem>
            </DocList>
          </DocSubsection>
        </DocSection>

        <DocSection title="Bước 4 — Nộp bài Audition">
          <DocList>
            <DocListItem>
              Chỉ mở sau khi hồ sơ đăng ký đã <strong className="font-semibold text-[#1c1b1b]">nộp thành công</strong>
            </DocListItem>
            <DocListItem>
              Vào <strong className="font-semibold text-[#1c1b1b]">Audition</strong> (
              <Link href="/dashboard/audition" className={docLinkClass}>
                /dashboard/audition
              </Link>
              )
            </DocListItem>
            <DocListItem>
              Điền các mục:{" "}
              <strong className="font-semibold text-[#1c1b1b]">
                tiêu đề, bài toán, người dùng mục tiêu, tóm tắt giải pháp, tác động, cách dùng Gemini / Google AI
                Studio, quy trình prompting, hướng kỹ thuật
              </strong>
            </DocListItem>
            <DocListItem>
              Thêm <strong className="font-semibold text-[#1c1b1b]">URL video giới thiệu, demo, repository</strong> (nếu
              có)
            </DocListItem>
            <DocListItem>
              Hệ thống <strong className="font-semibold text-[#1c1b1b]">tự lưu</strong> khi bạn rời mỗi ô nhập
            </DocListItem>
            <DocListItem>
              Tích <strong className="font-semibold text-[#1c1b1b]">cam kết bài dự thi nguyên gốc</strong>
            </DocListItem>
            <DocListItem>
              <strong className="font-semibold text-[#1c1b1b]">Nhóm trưởng</strong> bấm{" "}
              <strong className="font-semibold text-[#1c1b1b]">Nộp bài</strong> khi đã hoàn tất — sau khi nộp, bài có
              thể bị khóa chỉnh sửa tùy cài đặt của Ban Tổ chức
            </DocListItem>
          </DocList>
        </DocSection>

        <DocSection title="Tài liệu tham khảo">
          <DocList>
            <DocListItem>
              Thể lệ:{" "}
              <Link href="/the-le" className={docLinkClass}>
                /the-le
              </Link>
            </DocListItem>
            <DocListItem>
              Hướng dẫn Audition:{" "}
              <Link href="/huong-dan-audition" className={docLinkClass}>
                /huong-dan-audition
              </Link>
            </DocListItem>
            <DocListItem>
              Câu hỏi thường gặp:{" "}
              <Link href="/faq" className={docLinkClass}>
                /faq
              </Link>
            </DocListItem>
          </DocList>
        </DocSection>

        <DocSection title="Cần hỗ trợ?">
          <DocList>
            <DocListItem>
              Kiểm tra <strong className="font-semibold text-[#1c1b1b]">Thông báo</strong> trong bảng điều khiển
            </DocListItem>
            <DocListItem>
              Liên hệ Ban Tổ chức qua trang{" "}
              <Link href="/lien-he" className={docLinkClass}>
                /lien-he
              </Link>
            </DocListItem>
          </DocList>
        </DocSection>
      </div>

      <DocParagraph>
        <span className="mt-6 block pt-2">Chúc các đội hoàn thành hồ sơ và bài Audition đúng hạn.</span>
      </DocParagraph>
    </article>
  );
}
