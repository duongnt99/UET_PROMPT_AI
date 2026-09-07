"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/#gioi-thieu", label: "Giới thiệu" },
  { href: "/tin-tuc", label: "Thông báo" },
  { href: "/#lich-trinh", label: "Lịch trình" },
  { href: "/#tieu-chi", label: "Tiêu chí chấm điểm" },
  { href: "/#faq", label: "FAQ" },
];

export function PublicHeader({ workspaceHref, brandName }: { workspaceHref?: string | null; brandName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-chrome sticky top-0 z-40 border-b border-white/40 bg-white/70 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" className="display text-lg font-extrabold tracking-[-0.03em] text-[#4285F4] md:text-[1.625rem]">
          {brandName}
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 text-sm font-semibold tracking-[0.035em] md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-600 transition hover:text-[#4285F4]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center md:flex">
          {workspaceHref ? (
            <Button asChild className="h-10 rounded-full bg-[#4285F4] px-5 text-white shadow-[0_8px_22px_rgba(66,133,244,0.24)] hover:bg-[#2f72df]">
              <Link href={workspaceHref}>Vào hệ thống</Link>
            </Button>
          ) : (
            <Button asChild className="h-10 rounded-full bg-[#4285F4] px-5 text-white shadow-[0_8px_22px_rgba(66,133,244,0.24)] hover:bg-[#2f72df]">
              <Link href="/dang-ky">Đăng ký ngay</Link>
            </Button>
          )}
        </div>
        <button
          className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="space-y-1 border-t border-slate-100 bg-white px-5 pb-5 pt-3 shadow-lg md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#4285F4]/5 hover:text-[#4285F4]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {workspaceHref ? (
            <Link href={workspaceHref} className="mt-2 block rounded-xl bg-[#4285F4] px-3 py-2.5 text-center font-semibold text-white" onClick={() => setOpen(false)}>
              Vào hệ thống
            </Link>
          ) : (
            <Link href="/dang-ky" className="mt-2 block rounded-xl bg-[#4285F4] px-3 py-2.5 text-center font-semibold text-white" onClick={() => setOpen(false)}>
              Đăng ký ngay
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}

const FOOTER_LINKS = [
  { href: "/the-le", label: "Thể lệ" },
  { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
  { href: "/dieu-khoan", label: "Điều khoản" },
];

export function PublicFooter({ brandName }: { brandName: string }) {
  return (
    <footer className="public-chrome mt-auto border-t border-slate-200/20 bg-[#f0eded]/50 text-slate-900 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="display text-2xl font-extrabold tracking-[-0.03em] text-[#4285F4] md:text-[2rem]">{brandName}</p>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Đồng tổ chức: ĐHQGHN, Trường Đại học Công nghệ và Google.
          </p>
        </div>
        <nav aria-label="Điều hướng cuối trang" className="flex flex-wrap gap-x-6 gap-y-2 text-base text-slate-600 md:justify-end md:text-lg">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[#4285F4]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
