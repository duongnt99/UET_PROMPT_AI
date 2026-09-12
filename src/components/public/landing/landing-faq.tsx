"use client";

import { FormattedText } from "@/components/public/formatted-text";
import { LANDING_ASSETS } from "@/config/landing-assets";

export type LandingFaqItem = {
  id: string;
  question: string;
  answerMarkdown: string;
};

export const DEFAULT_FAQ_ITEMS: LandingFaqItem[] = [
  {
    id: "audience",
    question: "Đối tượng tham gia cuộc thi là ai?",
    answerMarkdown: "Sinh viên các trường đại học trên toàn quốc đáp ứng điều kiện trong thể lệ.",
  },
  {
    id: "team",
    question: "Quy định về hình thức và thành viên đội thi như thế nào?",
    answerMarkdown: "Cuộc thi hỗ trợ đăng ký cá nhân hoặc theo đội theo quy định trong thể lệ chính thức.",
  },
  {
    id: "fee",
    question: "Tham gia cuộc thi có mất phí không?",
    answerMarkdown: "Vòng tuyển chọn trực tuyến không thu phí tham gia theo thông báo của Ban Tổ chức.",
  },
  {
    id: "final-cost",
    question: "Chi phí tham dự Chung kết cho các thí sinh như thế nào?",
    answerMarkdown: "Ban Tổ chức sẽ công bố chính sách hỗ trợ thí sinh Chung kết trong thông báo chính thức.",
  },
  {
    id: "copyright",
    question: "Bản quyền các sản phẩm dự thi thuộc về ai?",
    answerMarkdown: "Thí sinh chịu trách nhiệm về sản phẩm và nguồn nội dung sử dụng trong bài dự thi.",
  },
  {
    id: "tools",
    question: "Các công cụ AI nào được phép sử dụng trong cuộc thi?",
    answerMarkdown: "Google Gemini và Google AI Studio là hai công cụ chính thức của cuộc thi.",
  },
  {
    id: "account",
    question: "Thí sinh được cung cấp tài khoản AI như thế nào?",
    answerMarkdown: "Các đội được lựa chọn vào vòng chung kết sẽ được cấp tài khoản Google AI Pro.",
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
  {
    id: "final-prep",
    question: "Thí sinh tham gia vòng chung kết cần chuẩn bị gì?",
    answerMarkdown: "Thí sinh cần chuẩn bị theo hướng dẫn chính thức của Ban Tổ chức trước ngày Chung kết.",
  },
];

export function LandingFaq({ items }: { items: LandingFaqItem[] }) {
  return (
    <section id="faq" className="relative z-[1] scroll-mt-24 px-5 pb-20 md:px-[clamp(16px,16.8vw,256px)]">
      <div className="mx-auto max-w-[1016px]">
        <h2 className="display mb-10 text-center text-[clamp(18px,2.6vw,40px)] font-bold leading-[64px] tracking-[-0.56px] text-[#1c1b1b]">
          Câu hỏi thường gặp
        </h2>
        <div className="flex flex-col gap-4">
          {items.map((faq) => (
            <details
              key={faq.id}
              className="group rounded-3xl border border-white/60 bg-white/85 shadow-[0_20px_40px_0_rgba(66,133,244,0.08)] backdrop-blur-lg open:border-[#4285F4]/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-[24.8px] [&::-webkit-details-marker]:hidden">
                <p className="display m-0 flex-1 text-lg font-bold leading-7 text-[#134dab]">{faq.question}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src={LANDING_ASSETS.chevron}
                  className="ml-4 h-[14px] w-3 shrink-0 transition group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-slate-100 px-6 pb-6 pt-2">
                <FormattedText text={faq.answerMarkdown} className="text-sm leading-7 text-[#424753] md:text-base" />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
