import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function Page() {
  return (
    <CmsArticle
      slug="gioi-thieu"
      fallbackTitle="Giới thiệu"
      fallback="Cuộc thi Prompt-Off: Vietnam 2026 do Đại học Quốc gia Hà Nội triển khai."
    />
  );
}
