import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guards";
import { logoutAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Quản trị" };

export const dynamic = "force-dynamic";

const NAV_SECTIONS = [
  { title: "Chung", links: [["/admin", "Tổng quan"], ["/admin/content", "Nội dung"], ["/admin/announcements", "Thông báo"], ["/admin/email", "Thông báo email"], ["/admin/faqs", "Câu hỏi thường gặp"]] },
  { title: "Vòng tuyển chọn", links: [["/admin/registrations", "Hồ sơ đăng ký"], ["/admin/submissions", "Bài dự thi"], ["/admin/reviewers", "Người chấm vòng loại"], ["/admin/review-assignments", "Phân công chấm"], ["/admin/rubrics", "Bộ tiêu chí chấm"], ["/admin/finalists", "Đội vào chung kết"]] },
  { title: "Vòng chung kết", links: [["/admin/bracket", "Bảng đấu"], ["/admin/challenges", "Đề thi"], ["/admin/judges", "Giám khảo"], ["/admin/scoring", "Chấm chung kết"]] },
  { title: "Hệ thống", links: [["/admin/users", "Tài khoản"], ["/admin/roles", "Phân quyền"], ["/admin/settings", "Cài đặt cuộc thi"], ["/admin/operations", "Vận hành kỹ thuật"], ["/admin/incidents", "Sự cố"], ["/admin/audit", "Nhật ký hệ thống"], ["/admin/exports", "Xuất dữ liệu"]] },
] as const;

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAnyRole(["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"]);
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 overflow-y-auto bg-[#0B1F3A] p-4 text-white md:block">
        <p className="font-semibold">Quản trị AI Arena Viet Nam</p>
        <nav className="mt-4 space-y-5 text-sm">
          {NAV_SECTIONS.map((section) => (
            <section key={section.title}>
              <p className="px-2 text-[0.68rem] font-bold uppercase tracking-wider text-white/45">{section.title}</p>
              <div className="mt-1 space-y-1">
                {section.links.map(([href, label]) => (
                  <Link key={href} href={href} className="block rounded px-2 py-1 text-white/80 hover:bg-white/10">
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
        <form action={logoutAction} className="mt-6">
          <Button type="submit" variant="accent" size="sm">
            Đăng xuất
          </Button>
        </form>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
