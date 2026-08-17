"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizerLogos } from "@/components/public/organizer-logos";

const NAV = [
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/the-le", label: "Thể lệ" },
  { href: "/lich-trinh", label: "Lịch trình" },
  { href: "/tieu-chi-cham", label: "Tiêu chí chấm" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/lien-he", label: "Liên hệ" },
];

export function PublicHeader({ workspaceHref }: { workspaceHref?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1F3A]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Prompt-Off: Vietnam 2026
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-white/80 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {workspaceHref ? (
            <Button asChild variant="accent">
              <Link href={workspaceHref}>Vào hệ thống</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/dang-nhap">Đăng nhập</Link>
              </Button>
              <Button asChild variant="accent">
                <Link href="/dang-ky">Đăng ký ngay</Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div className="space-y-2 px-4 pb-4 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block py-1 text-white/90" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {workspaceHref ? (
            <Link href={workspaceHref} className="block py-1 font-semibold text-[#C9A227]" onClick={() => setOpen(false)}>
              Vào hệ thống
            </Link>
          ) : (
            <Link href="/dang-ky" className="block py-1 font-semibold text-[#C9A227]">
              Đăng ký ngay
            </Link>
          )}
        </div>
      ) : null}
      <div className="border-t border-white/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Đồng tổ chức</p>
          <OrganizerLogos size="header" />
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-semibold text-[#0B1F3A]">Prompt-Off: Vietnam 2026</p>
          <p className="mt-2 text-sm text-slate-600">
            Đồng tổ chức: Đại học Quốc gia Hà Nội, Trường Đại học Công nghệ (đầu mối phối hợp) và Google.
          </p>
          <div className="mt-4">
            <OrganizerLogos size="footer" />
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Thông tin</p>
          <div className="mt-2 flex flex-col gap-1">
            <Link href="/the-le">Thể lệ</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
            <Link href="/dieu-khoan">Điều khoản</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Theo dõi sự kiện</p>
          <div className="mt-2 flex flex-col gap-1">
            <Link href="/livestream">Livestream</Link>
            <Link href="/scoreboard">Scoreboard</Link>
            <Link href="/finalists">Finalists</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
