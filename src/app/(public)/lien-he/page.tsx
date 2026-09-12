import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Liên hệ" };
export default function Page() {
  return (
    <CmsArticle
      slug="lien-he"
      fallbackTitle="Liên hệ"
      fallback="Ban Tổ chức AI Arena Viet Nam — Trường Đại học Công nghệ, ĐHQGHN."
    />
  );
}
