import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Điều khoản" };
export default function Page() {
  return (
    <CmsArticle
      slug="dieu-khoan"
      fallbackTitle="Điều khoản"
      fallback="Thí sinh cam kết thông tin trung thực và tuân thủ thể lệ."
    />
  );
}
