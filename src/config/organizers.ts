export type Organizer = {
  name: string;
  shortName: string;
  role: "CO_ORGANIZER" | "HOST";
  imageUrl: string;
  miniImageUrl: string;
  href: string;
};

export const ORGANIZERS: readonly Organizer[] = [
  {
    name: "Đại học Quốc gia Hà Nội",
    shortName: "ĐHQGHN",
    role: "CO_ORGANIZER",
    imageUrl: "/partners/vnu.png",
    miniImageUrl: "/partners/vnu-mini.png",
    href: "https://www.vnu.edu.vn/",
  },
  {
    name: "Trường Đại học Công nghệ — ĐHQGHN",
    shortName: "UET",
    role: "HOST",
    imageUrl: "/partners/uet.jpg",
    miniImageUrl: "/partners/uet-mini.jpg",
    href: "https://uet.vnu.edu.vn/",
  },
  {
    name: "Google",
    shortName: "Google",
    role: "CO_ORGANIZER",
    imageUrl: "/partners/google-wordmark.png",
    miniImageUrl: "/partners/google-mini.jpg",
    href: "https://about.google/",
  },
];

export const CO_ORGANIZERS = ORGANIZERS.filter((item) => item.role === "CO_ORGANIZER");
export const HOST_ORGANIZERS = ORGANIZERS.filter((item) => item.role === "HOST");
