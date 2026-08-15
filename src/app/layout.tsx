import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import { ToastProvider } from "@/components/ui/toaster";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Prompt-Off: Vietnam 2026",
    template: "%s | Prompt-Off: Vietnam 2026",
  },
  description:
    "Cuộc thi Prompt-Off: Vietnam 2026 do ĐHQGHN triển khai, Trường Đại học Công nghệ làm đầu mối phối hợp, phối hợp cùng Google.",
  openGraph: {
    title: "Prompt-Off: Vietnam 2026",
    description: "Sân chơi quốc gia về prompting và xây dựng MVP bằng Gemini.",
    locale: "vi_VN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
