import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db/prisma";
import { APP_TIMEZONE } from "@/lib/dates";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  LandingFinalRoundsForm,
  LandingOverviewForm,
  LandingResourcesForm,
  TimelineItemForm,
} from "@/components/admin/cms-forms";
import { requirePermission } from "@/lib/auth/guards";
import { getProductionCompetition } from "@/server/services/competition-service";
import { contentStatusLabel } from "@/lib/status-labels";

function tone(status: string) {
  if (status === "PUBLISHED") return "green" as const;
  if (status === "DRAFT") return "gold" as const;
  if (status === "SCHEDULED") return "blue" as const;
  return "slate" as const;
}

function toDatetimeLocal(value: Date | null) {
  if (!value) return "";
  return formatInTimeZone(value, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

export default async function Page() {
  await requirePermission("content:manage");
  const competition = await getProductionCompetition();
  const [pages, timeline] = competition
    ? await Promise.all([
        prisma.staticPage.findMany({
          where: { competitionId: competition.id },
          orderBy: { slug: "asc" },
        }),
        prisma.timelineItem.findMany({
          where: { competitionId: competition.id },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        }),
      ])
    : [[], []];
  const criteriaPage = pages.find((page) => page.slug === "tieu-chi-cham");
  const regularPages = pages.filter((page) => page.slug !== "tieu-chi-cham");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl">Quản lý nội dung</h1>
          <p className="mt-1 text-sm text-slate-600">
            Chỉnh nội dung trang chủ và các trang thông tin. Thay đổi được ghi vào hệ thống ngay khi lưu.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/admin/content/new">Tạo trang tĩnh</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <p className="font-semibold">Giới thiệu trang chủ</p>
          <p className="mt-1 text-sm text-slate-600">Tiêu đề, mô tả, đối tượng và công cụ.</p>
          <Link href="#gioi-thieu-trang-chu" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
            Chỉnh nội dung
          </Link>
        </Card>
        <Card className="p-4">
          <p className="font-semibold">Lịch trình</p>
          <p className="mt-1 text-sm text-slate-600">
            {timeline.length > 0
              ? `${timeline.length} mốc đang được quản lý.`
              : "Chưa có mốc trong hệ thống — trang chủ đang hiển thị lịch trình mặc định."}
          </p>
          <Link href="#lich-trinh" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
            Chỉnh lịch trình
          </Link>
        </Card>
        <Card className="p-4">
          <p className="font-semibold">Vòng chung kết</p>
          <p className="mt-1 text-sm text-slate-600">Tiêu đề và mô tả của 4 thẻ trên trang chủ.</p>
          <Link href="#vong-chung-ket" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
            Chỉnh nội dung
          </Link>
        </Card>
        <Card className="p-4">
          <p className="font-semibold">Tiêu chí chấm điểm</p>
          <p className="mt-1 text-sm text-slate-600">Nội dung giới thiệu và các rubric đang kích hoạt.</p>
          <Link href="#tieu-chi-cham" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
            Mở tùy chọn
          </Link>
        </Card>
        <Card className="p-4">
          <p className="font-semibold">Tài nguyên khác</p>
          <p className="mt-1 text-sm text-slate-600">Thẻ VibeCoding và danh sách liên kết tài liệu trên trang chủ.</p>
          <Link href="#tai-nguyen" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
            Chỉnh nội dung
          </Link>
        </Card>
      </div>

      <section id="gioi-thieu-trang-chu" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="display text-2xl">Giới thiệu trên trang chủ</h2>
          <p className="mt-1 text-sm text-slate-600">
            Đây là các nội dung ở phần đầu trang và khối “Thông tin cuộc thi” mà người xem nhìn thấy đầu tiên.
          </p>
        </div>
        {competition ? (
          <Card>
            <LandingOverviewForm key={`overview-${competition.version}`} settings={competition.settings} />
          </Card>
        ) : (
          <Card><p className="text-sm text-red-700">Chưa có cuộc thi production để lưu nội dung.</p></Card>
        )}
      </section>

      <section id="lich-trinh" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="display text-2xl">Lịch trình</h2>
          <p className="mt-1 text-sm text-slate-600">
            Các mốc Đã đăng xuất hiện trên trang chủ và trang Lịch trình theo thứ tự hiển thị.
          </p>
        </div>

        <Card>
          <details>
            <summary className="cursor-pointer font-semibold text-slate-900">+ Tạo mốc lịch trình mới</summary>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <TimelineItemForm />
            </div>
          </details>
        </Card>

        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600">Chưa có mốc nào. Trang công khai đang dùng nội dung mặc định.</p>
        ) : null}
        {timeline.map((item) => (
          <Card key={item.id} className="p-0">
            <details>
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5">
                <span>
                  <span className="font-semibold">{item.title}</span>
                  <span className="ml-2 text-xs text-slate-500">Thứ tự {item.displayOrder}</span>
                </span>
                <Badge tone={tone(item.status)}>{contentStatusLabel(item.status)}</Badge>
              </summary>
              <div className="border-t border-slate-200 p-5">
                <TimelineItemForm
                  item={{
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    startAt: toDatetimeLocal(item.startAt),
                    endAt: toDatetimeLocal(item.endAt),
                    statusLabel: item.statusLabel,
                    displayOrder: item.displayOrder,
                    status: item.status,
                  }}
                />
              </div>
            </details>
          </Card>
        ))}
      </section>

      <section id="vong-chung-ket" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="display text-2xl">Vòng chung kết</h2>
          <p className="mt-1 text-sm text-slate-600">
            Chỉnh tiêu đề và mô tả của phần thi thực hành, thuyết trình, quyết định kết quả và yêu cầu bất ngờ.
          </p>
        </div>
        {competition ? (
          <Card>
            <LandingFinalRoundsForm
              key={`final-rounds-${competition.version}`}
              settings={competition.settings}
            />
            <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
              Thời lượng thi và trạng thái bật/tắt yêu cầu bất ngờ đã có ở{" "}
              <Link href="/admin/settings" className="font-semibold text-blue-700 underline">
                Cài đặt cuộc thi
              </Link>
              , nên không lặp lại tại đây.
            </p>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-red-700">Chưa có cuộc thi production để lưu nội dung.</p>
          </Card>
        )}
      </section>

      <section id="tai-nguyen" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="display text-2xl">Tài nguyên khác</h2>
          <p className="mt-1 text-sm text-slate-600">
            Chỉnh tiêu đề, mô tả, liên kết cẩm nang và danh sách tài liệu Google AI Studio trên trang chủ.
          </p>
        </div>
        {competition ? (
          <Card>
            <LandingResourcesForm
              key={`landing-resources-${competition.version}`}
              settings={competition.settings}
            />
          </Card>
        ) : (
          <Card><p className="text-sm text-red-700">Chưa có cuộc thi production để lưu nội dung.</p></Card>
        )}
      </section>

      <section id="tieu-chi-cham" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="display text-2xl">Tiêu chí chấm điểm</h2>
          <p className="mt-1 text-sm text-slate-600">
            Phần này đã có hai form chuyên biệt nên được liên kết lại, không tạo dữ liệu trùng.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <p className="font-semibold">Tiêu đề và đoạn giới thiệu</p>
            <p className="mt-1 text-sm text-slate-600">Nội dung từ trang tĩnh /tieu-chi-cham.</p>
            {criteriaPage ? (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href={`/admin/content/${criteriaPage.id}`}>Chỉnh nội dung giới thiệu</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/admin/content/new">Tạo trang tieu-chi-cham</Link>
              </Button>
            )}
          </Card>
          <Card>
            <p className="font-semibold">Trọng số, tên và mô tả tiêu chí</p>
            <p className="mt-1 text-sm text-slate-600">
              Các thẻ trên trang chủ lấy từ rubric Vòng tuyển chọn đang được kích hoạt.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/admin/rubrics">Quản lý rubric</Link>
            </Button>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="display text-2xl">Các trang nội dung tĩnh khác</h2>
          <p className="mt-1 text-sm text-slate-600">
            Thể lệ, giới thiệu, hướng dẫn Audition, liên hệ… Chỉ mục Đã đăng mới hiện trên website.
          </p>
        </div>
        <div className="space-y-3">
          {regularPages.length === 0 ? <p className="text-sm text-slate-600">Chưa có trang tĩnh.</p> : null}
          {regularPages.map((page) => (
            <Link key={page.id} href={`/admin/content/${page.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{page.title}</p>
                  <p className="text-sm text-slate-600">/{page.slug}</p>
                </div>
                <Badge tone={tone(page.status)}>{contentStatusLabel(page.status)}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
