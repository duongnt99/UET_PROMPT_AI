import { CmsArticle } from "@/components/public/cms-article";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Chính sách bảo mật" };
export default function Page() {
  return (
    <CmsArticle
      slug="chinh-sach-bao-mat"
      fallbackTitle="Chính sách bảo mật"
      fallback="Hệ thống chỉ thu thập dữ liệu cần thiết cho đăng ký và vận hành cuộc thi."
    />
  );
}
