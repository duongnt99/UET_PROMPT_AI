import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Thể lệ" };
export default function Page() {
  return (
    <CmsArticle
      slug="the-le"
      fallbackTitle="Thể lệ"
      fallback="Thể lệ khung: chung kết 8 đội, không bye, Sprint 5 phút (có thể thử 10 phút), Pitch 60 giây, công cụ Gemini và Google AI Studio. Bản chính thức Ban Tổ chức đang hoàn thiện."
    />
  );
}
