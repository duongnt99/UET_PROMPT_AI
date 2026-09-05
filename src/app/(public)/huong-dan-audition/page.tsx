import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Hướng dẫn Audition" };
export default function Page() {
  return (
    <CmsArticle
      slug="huong-dan-audition"
      fallbackTitle="Hướng dẫn Audition"
      fallback="Nộp video giới thiệu và/hoặc thử thách vibe coding với Gemini và Google AI Studio. Kết quả kỳ vọng là proof of concept, không cần backend."
    />
  );
}
