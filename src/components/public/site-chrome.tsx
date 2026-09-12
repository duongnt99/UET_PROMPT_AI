"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LANDING_ASSETS } from "@/config/landing-assets";

type NavItem = {
  id: string;
  href: string;
  label: string;
  sectionId?: string;
  matchPath?: string;
};

const NAV: NavItem[] = [
  { id: "gioi-thieu", href: "/#gioi-thieu", label: "Giới thiệu", sectionId: "gioi-thieu" },
  { id: "thong-bao", href: "/tin-tuc", label: "Thông báo", matchPath: "/tin-tuc" },
  { id: "lich-trinh", href: "/#lich-trinh", label: "Lịch trình", sectionId: "lich-trinh" },
  { id: "tieu-chi", href: "/#tieu-chi", label: "Tiêu chí chấm điểm", sectionId: "tieu-chi" },
  { id: "faq", href: "/#faq", label: "FAQ", sectionId: "faq" },
];

const FOOTER_LINKS = [
  { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
  { href: "/dieu-khoan", label: "Điều khoản" },
];

function resolveActiveId(pathname: string, hash: string) {
  const newsItem = NAV.find((item) => item.matchPath && pathname.startsWith(item.matchPath));
  if (newsItem) return newsItem.id;

  if (pathname !== "/") return "";

  const sectionItem = NAV.find((item) => item.sectionId && item.sectionId === hash);
  if (sectionItem) return sectionItem.id;

  return "gioi-thieu";
}

export function PublicHeader({ workspaceHref, brandName }: { workspaceHref?: string | null; brandName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("gioi-thieu");

  const syncActiveFromLocation = useCallback(() => {
    const hash = window.location.hash.replace("#", "");
    setActiveId(resolveActiveId(pathname, hash));
  }, [pathname]);

  useEffect(() => {
    syncActiveFromLocation();
    window.addEventListener("hashchange", syncActiveFromLocation);
    return () => window.removeEventListener("hashchange", syncActiveFromLocation);
  }, [syncActiveFromLocation]);

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = NAV
      .filter((item) => item.sectionId)
      .map((item) => document.getElementById(item.sectionId!))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0];
        if (top?.target.id) {
          setActiveId(top.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  const navLinkClass = (active: boolean) =>
    `whitespace-nowrap text-xs font-semibold tracking-[0.5px] no-underline transition lg:text-sm lg:tracking-[0.7px] ${
      active ? "text-[#4285f4] border-b-[1.6px] border-[#4285f4] pb-1" : "text-[#424753]"
    }`;

  return (
    <header className="public-chrome fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/70 text-[#424753] shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-[52px]">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="display shrink-0 text-[22px] font-extrabold leading-10 tracking-[-0.02em] no-underline sm:text-[26px]">
            <span className="landing-brand-gradient whitespace-nowrap">{brandName}</span>
          </Link>
          <div className="hidden h-10 shrink-0 items-center rounded-full border border-black/[0.08] bg-white/85 px-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] xl:flex">
            <Image
              src={LANDING_ASSETS.logoVnu}
              alt="Đại học Quốc gia Hà Nội"
              width={70}
              height={28}
              className="h-7 w-[70px] object-contain"
            />
            <span className="mx-2 h-[22px] w-px bg-black/12" />
            <Image
              src={LANDING_ASSETS.logoGoogle}
              alt="Google"
              width={62}
              height={22}
              className="h-[22px] w-[62px] object-contain"
            />
          </div>
        </div>

        <nav aria-label="Điều hướng chính" className="hidden min-w-0 items-center gap-4 lg:flex xl:gap-8">
          {NAV.map((item) => {
            const active = activeId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={navLinkClass(active)}
                onClick={() => setActiveId(item.id)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center md:flex">
          {workspaceHref ? (
            <Link
              href={workspaceHref}
              className="inline-flex h-10 items-center rounded-full bg-[#4285F4] px-6 text-sm font-semibold tracking-[0.7px] text-white no-underline shadow-[0_4px_6px_-1px_rgba(66,133,244,0.3),0_2px_4px_-2px_rgba(66,133,244,0.3)] transition hover:bg-[#2f72df]"
            >
              Vào hệ thống
            </Link>
          ) : (
            <Link
              href="/dang-ky"
              className="inline-flex h-10 items-center rounded-full bg-[#4285F4] px-6 text-sm font-semibold tracking-[0.7px] text-white no-underline shadow-[0_4px_6px_-1px_rgba(66,133,244,0.3),0_2px_4px_-2px_rgba(66,133,244,0.3)] transition hover:bg-[#2f72df]"
            >
              Đăng ký ngay
            </Link>
          )}
        </div>

        <button
          className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="space-y-1 border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-lg sm:px-[52px] lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`block rounded-xl px-3 py-2.5 text-sm font-semibold ${
                activeId === item.id ? "bg-[#4285F4]/10 text-[#4285F4]" : "text-slate-700 hover:bg-[#4285F4]/5 hover:text-[#4285F4]"
              }`}
              onClick={() => {
                setActiveId(item.id);
                setOpen(false);
              }}
            >
              {item.label}
            </Link>
          ))}
          {workspaceHref ? (
            <Link
              href={workspaceHref}
              className="mt-2 block rounded-xl bg-[#4285F4] px-3 py-2.5 text-center font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Vào hệ thống
            </Link>
          ) : (
            <Link
              href="/dang-ky"
              className="mt-2 block rounded-xl bg-[#4285F4] px-3 py-2.5 text-center font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Đăng ký ngay
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter({ brandName, contactEmail }: { brandName: string; contactEmail?: string }) {
  return (
    <footer className="public-chrome relative z-[1] border-t border-[#c2c6d5]/10 bg-[#f0eded]/50 backdrop-blur-md">
      <div className="mx-auto flex min-h-[60px] max-w-[1528px] flex-col flex-wrap items-start justify-between gap-4 px-4 py-3 sm:flex-row sm:items-center sm:px-[clamp(16px,5.2vw,80px)]">
        <div className="flex flex-col gap-0.5">
          <p className="display m-0 text-xl font-extrabold leading-7 tracking-[-0.02em]">
            <span className="landing-brand-gradient">{brandName}</span>
          </p>
          {contactEmail ? (
            <p className="m-0 text-sm leading-5 text-[#424753]">📩 Email: {contactEmail}</p>
          ) : null}
        </div>
        <nav aria-label="Điều hướng cuối trang" className="flex flex-wrap gap-6 text-[13px] leading-5 text-[#424753]">
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="no-underline transition hover:text-[#4285F4]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
