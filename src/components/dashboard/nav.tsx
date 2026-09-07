import Link from "next/link";
import { logoutAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { homePathForRoles, type Role } from "@/server/domain/permissions";

const LINKS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/dashboard/ho-so", label: "Hồ sơ" },
  { href: "/dashboard/doi-thi", label: "Đội thi" },
  { href: "/dashboard/dang-ky", label: "Đăng ký" },
  { href: "/dashboard/audition", label: "Audition" },
  { href: "/dashboard/thi-truc-tiep", label: "Thi trực tiếp" },
  { href: "/dashboard/thong-bao", label: "Thông báo" },
  { href: "/dashboard/bien-nhan", label: "Biên nhận" },
];

export function DashboardNav({ email, roles }: { email: string; roles: Role[] }) {
  const workspace = homePathForRoles(roles);
  const showWorkspace = workspace !== "/dashboard";
  return (
    <aside className="w-full border-b border-slate-200 bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Thí sinh</p>
        <p className="truncate text-sm font-medium">{email}</p>
      </div>
      <nav className="flex flex-wrap gap-2 p-4 md:flex-col">
        {showWorkspace ? (
          <Link href={workspace} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100">
            Về trang làm việc
          </Link>
        ) : null}
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100">
            {link.label}
          </Link>
        ))}
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start">
            Đăng xuất
          </Button>
        </form>
      </nav>
    </aside>
  );
}
