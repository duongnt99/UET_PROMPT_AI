import Image from "next/image";
import Link from "next/link";
import { LANDING_ASSETS } from "@/config/landing-assets";

const HERO_PARAGRAPHS = [
  <>
    Cuộc thi ứng dụng AI do Đại học Quốc gia Hà Nội (ĐHQGHN) triển khai, Trường Đại học Công nghệ (VNU-UET) làm đầu mối phối hợp cùng Google tổ chức. Đây là sân chơi công nghệ cho các bạn sinh viên trên toàn quốc, mở ra cơ hội thực chiến giải quyết các bài toán thực tế thông qua kỹ năng Natural Language Entrepreneurship trên nền tảng hai công cụ chính thức: <strong>Google Gemini</strong> và <strong>Google AI Studio</strong>.
  </>,
  <>
    Hành trình trải nghiệm bắt đầu từ Vòng tuyển chọn trực tuyến nhằm tìm kiếm 8 đội thi xuất sắc nhất bước vào Vòng Chung kết. Tại vòng đấu quyết định này, 8 đội sẽ trực tiếp tranh tài trên sân khấu để tìm ra nhà vô địch.
  </>,
  <>
    Vòng Chung kết sẽ diễn ra vào ngày <strong>03/11/2026</strong> tại <strong>Đại học Quốc gia Hà Nội</strong>
    <em> (144 Xuân Thủy, Cầu Giấy, Hà Nội)</em>.
  </>,
];

export function LandingHero() {
  return (
    <section id="gioi-thieu" className="relative z-[1] scroll-mt-24">
      <div className="relative mx-auto max-w-[1528px] px-5 pt-12 md:px-[clamp(16px,5.2vw,95px)] md:pt-[57px]">
        <div className="landing-hero-flex flex items-start gap-6 md:gap-[clamp(24px,4.2vw,64px)]">
          <div className="flex min-w-0 flex-1 flex-col">
            <Image
              src={LANDING_ASSETS.heroHeadline}
              alt="AI Arena Viet Nam 2026"
              width={923}
              height={118}
              priority
              className="landing-hero-headline mb-6 block h-auto w-full max-w-[923px] -ml-0 md:-ml-9"
            />

            <div className="max-w-[900px]">
              {HERO_PARAGRAPHS.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-justify text-[clamp(14px,1.2vw,18px)] leading-8 text-[#062f73] [&_em]:not-italic [&_strong]:font-bold"
                  style={{ marginBottom: index < 2 ? 16 : 0 }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 py-6 md:gap-4 md:py-8 lg:py-12">
              <Link
                href="/the-le"
                className="inline-flex items-center rounded-full border border-white/20 bg-[#db4437] px-7 py-3.5 text-xl font-extrabold tracking-[0.7px] text-white no-underline transition hover:bg-[#bd352a]"
              >
                Thể lệ
              </Link>
              <Link
                href="/tin-tuc/huong-dan-dang-ky-va-audition"
                className="inline-flex items-center rounded-full bg-[#4285F4] px-7 py-3.5 text-xl font-extrabold tracking-[0.7px] text-white underline shadow-[0_4px_6px_-1px_rgba(66,133,244,0.3),0_2px_4px_-2px_rgba(66,133,244,0.3)] no-underline transition hover:bg-[#2f72df]"
              >
                Hướng dẫn đăng ký và nộp bài
              </Link>
              <Link
                href="/dashboard/audition"
                className="inline-flex items-center rounded-full border border-white/20 bg-[#0f9d58] px-7 py-3.5 text-xl font-extrabold tracking-[0.7px] text-white no-underline transition hover:bg-[#0b8248]"
              >
                Nộp dự án vòng 1
              </Link>
            </div>
          </div>

          <div className="landing-hero-right mx-auto flex w-full max-w-[400px] shrink-0 flex-col md:mt-[clamp(40px,8vw,80px)] md:w-[clamp(240px,22.7vw,347px)] md:max-w-none">
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[40px] border border-white/50 bg-white/85 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-lg">
              <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-[#e8f0fe]/40 via-[#e6f4ea]/20 to-[#fce8e6]/20" />
              <div className="absolute right-[-16px] top-10 h-[47px] w-[46px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" src={LANDING_ASSETS.overlayCard} className="h-full w-full" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                src={LANDING_ASSETS.overlaySvg}
                className="absolute z-[1] h-[120px] w-[120px] opacity-15"
              />
              <Image
                src={LANDING_ASSETS.swagKit}
                alt="SWAG Kit"
                fill
                className="relative z-[2] object-cover"
                sizes="(max-width: 768px) 400px, 347px"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-[#4285F4]/30 bg-gradient-to-br from-[#e8f0fe] to-[#fef7e0] px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <p className="text-center text-[clamp(13px,1.2vw,15px)] font-extrabold leading-[22px] text-[#1a73e8]">
                🎁 Các thành viên 8 đội vào chung kết sẽ nhận được Bộ quà tặng của Google
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
