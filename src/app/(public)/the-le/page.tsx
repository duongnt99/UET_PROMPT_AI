import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Thể lệ" };
export default function Page() {
  return (
    <CmsArticle
      slug="the-le"
      fallbackTitle="Thể lệ"
      fallback="Thể lệ chính thức đang được Ban Tổ chức hoàn thiện."
    />
  );
}
