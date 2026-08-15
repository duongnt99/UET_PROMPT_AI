import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/guards";
import { logoutAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Quản trị" };

export const dynamic = "force-dynamic";

const LINKS = [
  ["/admin", "Tổng quan"],
  ["/admin/settings", "Cài đặt"],
  ["/admin/content", "Nội dung"],
  ["/admin/announcements", "Thông báo"],
  ["/admin/faqs", "FAQ"],
  ["/admin/users", "Tài khoản"],
  ["/admin/roles", "Vai trò"],
  ["/admin/registrations", "Đăng ký"],
  ["/admin/submissions", "Bài nộp"],
  ["/admin/reviewers", "Reviewer"],
  ["/admin/review-assignments", "Phân công chấm"],
  ["/admin/rubrics", "Rubric"],
  ["/admin/finalists", "Finalist"],
  ["/admin/bracket", "Bracket"],
  ["/admin/judges", "Giám khảo"],
  ["/admin/scoring", "Chấm chung kết"],
  ["/admin/operations", "Vận hành"],
  ["/admin/incidents", "Sự cố"],
  ["/admin/audit", "Audit"],
  ["/admin/exports", "Export"],
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAnyRole(["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"]);
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 overflow-y-auto bg-[#0B1F3A] p-4 text-white md:block">
        <p className="font-semibold">Prompt-Off Admin</p>
        <nav className="mt-4 space-y-1 text-sm">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 text-white/80 hover:bg-white/10">
              {label}
            </Link>
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
