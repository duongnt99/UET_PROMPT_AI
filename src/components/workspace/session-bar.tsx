import Link from "next/link";
import { logoutAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function WorkspaceSessionBar({
  title,
  email,
  homeHref,
}: {
  title: string;
  email: string;
  homeHref: string;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
      <Link href={homeHref} className="font-semibold text-[#0B1F3A]">
        {title}
      </Link>
      <div className="flex min-w-0 items-center gap-3">
        <p className="hidden truncate text-sm text-slate-600 sm:block">{email}</p>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Đăng xuất
          </Button>
        </form>
      </div>
    </header>
  );
}

export function StageLogoutButton() {
  return (
    <form action={logoutAction} className="absolute right-4 top-4 z-10">
      <Button type="submit" variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">
        Đăng xuất
      </Button>
    </form>
  );
}
