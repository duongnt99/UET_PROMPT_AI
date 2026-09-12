import type { Metadata } from "next";
import { TheLePage } from "@/components/public/the-le/the-le-page";

export const metadata: Metadata = {
  title: "Thể lệ cuộc thi",
  description:
    "Thể lệ chính thức AI Arena Vietnam 2026: đối tượng dự thi, các vòng thi, tiêu chí chấm điểm, cơ cấu giải thưởng, lịch trình và quy định thi đấu.",
};

export default function Page() {
  return <TheLePage />;
}
