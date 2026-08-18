import Link from "next/link";
import { getPublicHomeData } from "@/server/services/content-service";
import { formatDate, formatDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/form";
import { OrganizerLogos } from "@/components/public/organizer-logos";
import { publicLabel } from "@/server/services/competition-service";

export default async function HomePage() {
  const data = await getPublicHomeData();
  const settings = data?.competition.settings;
  const eventDateLabel = settings?.eventDate
    ? publicLabel(settings.eventDateStatus, formatDate(settings.eventDate))
    : "Đang cập nhật";
  const venueLabel = settings ? publicLabel(settings.venueStatus, settings.venue) : "Đang cập nhật";
  const criteriaIntro = data?.pages.find((page) => page.slug === "tieu-chi-cham");

  return (
    <div>
      <section className="bg-[#0B1F3A] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#C9A227]">ĐHQGHN · UET · Google</p>
            <h1 className="display mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              Prompt-Off: Vietnam 2026
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">
              {settings?.shortDescription ??
                "Sân chơi quốc gia để sinh viên ứng dụng AI tạo sinh, prompting và xây dựng MVP bằng Gemini."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link href="/dang-ky">Đăng ký ngay</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href="/dashboard/audition">Nộp bài Audition</Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/the-le">Xem thể lệ</Link>
              </Button>
            </div>
          </div>
          <Card className="bg-white/5 text-white border-white/10">
            <p className="text-sm text-[#C9A227]">Thông tin sự kiện</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-white/60">Ngày chung kết</dt>
                <dd className="text-lg font-medium">{eventDateLabel}</dd>
              </div>
              <div>
                <dt className="text-white/60">Địa điểm</dt>
                <dd>{venueLabel}</dd>
              </div>
              <div>
                <dt className="text-white/60">Quy mô chung kết</dt>
                <dd>Dự kiến {settings?.finalistCount ?? 10} thí sinh/đội — thể thức bracket chưa chốt.</dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-3xl">Mục tiêu cuộc thi</h2>
        <p className="mt-4 max-w-3xl text-slate-700">
          {settings?.fullDescription ?? "Đang cập nhật nội dung giới thiệu chính thức."}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <h3 className="font-semibold">Đối tượng</h3>
            <p className="mt-2 text-sm text-slate-600">Sinh viên các đại học, trường đại học trên toàn quốc.</p>
          </Card>
          <Card>
            <h3 className="font-semibold">Vòng tuyển chọn</h3>
            <p className="mt-2 text-sm text-slate-600">
              Đăng ký trực tuyến, nộp video giới thiệu và/hoặc thử thách vibe coding với Gemini.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold">Chung kết trực tiếp</h3>
            <p className="mt-2 text-sm text-slate-600">The Sprint, The Pitch, The Verdict và On-stage Twist tại ĐHQGHN.</p>
          </Card>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-3xl">Lịch trình</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {(data?.timeline ?? []).map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-200 p-5">
                <Badge tone="gold">{item.statusLabel}</Badge>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                {item.startAt ? <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.startAt)}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-3xl">Vòng chung kết</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["The Sprint", "Hai thí sinh/đội nhận bài toán thực tiễn và dùng Gemini xây MVP trong thời gian giới hạn."],
            ["The Pitch", "Trình bày bài toán, giải pháp, cách sử dụng AI và sản phẩm đã hoàn thành."],
            ["The Verdict", "Ban Giám khảo chấm và quyết định đội đi tiếp."],
            ["On-stage Twist", "BTC có thể đưa thêm yêu cầu trong quá trình thi. Nội dung được bảo mật đến lúc công bố."],
          ].map(([title, body]) => (
            <Card key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[#0B1F3A] py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-3xl">{criteriaIntro?.title ?? "Tiêu chí chấm"}</h2>
          {criteriaIntro?.bodyMarkdown ? (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-white/80">{criteriaIntro.bodyMarkdown}</p>
          ) : (
            <p className="mt-2 text-white/70">Trọng số lấy từ rubric đang kích hoạt.</p>
          )}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(data?.rubric?.criteria ?? []).map((criterion) => (
              <Card key={criterion.id} className="bg-white/5 border-white/10 text-white">
                <p className="text-[#C9A227] text-sm">{criterion.weight.toString()}%</p>
                <h3 className="mt-1 text-xl font-semibold">{criterion.titleVi}</h3>
                <p className="mt-2 text-sm text-white/70">{criterion.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link href="/tieu-chi-cham">Xem đầy đủ tiêu chí</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-3xl">Câu hỏi thường gặp</h2>
        <div className="mt-6 space-y-4">
          {(data?.faqs ?? []).map((faq) => (
            <details key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-semibold">{faq.question}</summary>
              <p className="mt-2 text-sm text-slate-600">{faq.answerMarkdown}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-3xl">Tin tức</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(data?.news ?? []).map((item) => (
              <Link key={item.id} href={`/tin-tuc/${item.slug}`}>
                <Card>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.excerpt}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-3xl">Đơn vị đồng tổ chức</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Đại học Quốc gia Hà Nội triển khai cuộc thi, Trường Đại học Công nghệ là đầu mối phối hợp, phối hợp cùng
          Google.
        </p>
        <div className="mt-8">
          <OrganizerLogos />
        </div>
      </section>
    </div>
  );
}
