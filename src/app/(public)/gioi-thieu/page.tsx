import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function Page() {
  return (
    <CmsArticle
      slug="gioi-thieu"
      fallbackTitle="Giới thiệu"
      fallback="AI Arena Viet Nam do Đại học Quốc gia Hà Nội triển khai, Trường Đại học Công nghệ làm đầu mối phối hợp cùng Google tổ chức. Chung kết gồm 8 đội thi trực tiếp với Google Gemini và Google AI Studio."
    />
  );
}
