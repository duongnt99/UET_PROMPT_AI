import type { Metadata } from "next";
import { Be_Vietnam_Pro, Hanken_Grotesk, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
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

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "AI Arena Viet Nam",
    template: "%s | AI Arena Viet Nam",
  },
  description:
    "Cuộc thi AI Arena Viet Nam do ĐHQGHN, Trường Đại học Công nghệ và Google phối hợp tổ chức.",
  openGraph: {
    title: "AI Arena Viet Nam",
    description:
      "Sân chơi quốc gia về prompting với Gemini và Google AI Studio. Chung kết 8 đội, proof of concept 5–10 phút.",
    locale: "vi_VN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${beVietnam.variable} ${spaceGrotesk.variable} ${hankenGrotesk.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
