import type { MetadataRoute } from "next";

const paths = [
  "",
  "/gioi-thieu",
  "/the-le",
  "/lich-trinh",
  "/huong-dan-audition",
  "/tieu-chi-cham",
  "/faq",
  "/tin-tuc",
  "/lien-he",
  "/chinh-sach-bao-mat",
  "/dieu-khoan",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "http://localhost:3000";
  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
