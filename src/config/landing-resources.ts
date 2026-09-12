import { z } from "zod";

export type LandingResourceLink = {
  label: string;
  url: string;
  icon: string;
};

export const landingResourceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  icon: z.string().min(1),
});

export type LandingResourcesContent = {
  title: string;
  featuredBadge: string;
  featuredTitle: string;
  featuredDescription: string;
  handbookUrl: string;
  guideUrl: string;
  gridTitle: string;
  gridDescription: string;
  links: LandingResourceLink[];
};

export const LANDING_VIBE_HANDBOOK_URL =
  "https://docs.google.com/presentation/d/e/2PACX-1vT5FmgwnjE8Q2FhcWx7Cg89PrW6CujORX4bzUacuABBg1oeFrn6kXkPKhFXGxcVcbfkfUrF5tOxgrDx/pub?start=false&loop=false&delayms=60000&slide=id.g3e3769ea786_0_68";

export const LANDING_VIBE_GUIDE_URL =
  "https://docs.google.com/document/d/1YiObQCXJzd4Mw8RkEoDWohclAu_0gJe4-cVuIGg8h08/edit?tab=t.c7mqrgtpn7uv";

export function landingResourcesFromSettings(settings: {
  landingResourcesTitle: string;
  landingResourcesFeaturedBadge: string;
  landingResourcesFeaturedTitle: string;
  landingResourcesFeaturedDescription: string;
  landingResourcesHandbookUrl: string;
  landingResourcesGuideUrl: string;
  landingResourcesGridTitle: string;
  landingResourcesGridDescription: string;
  landingResourceLinks: LandingResourceLink[];
}): LandingResourcesContent {
  const defaults = defaultLandingResourcesContent();
  return {
    title: settings.landingResourcesTitle || defaults.title,
    featuredBadge: settings.landingResourcesFeaturedBadge || defaults.featuredBadge,
    featuredTitle: settings.landingResourcesFeaturedTitle || defaults.featuredTitle,
    featuredDescription: settings.landingResourcesFeaturedDescription || defaults.featuredDescription,
    handbookUrl: settings.landingResourcesHandbookUrl || defaults.handbookUrl,
    guideUrl: settings.landingResourcesGuideUrl || defaults.guideUrl,
    gridTitle: settings.landingResourcesGridTitle || defaults.gridTitle,
    gridDescription: settings.landingResourcesGridDescription || defaults.gridDescription,
    links: settings.landingResourceLinks?.length ? settings.landingResourceLinks : defaults.links,
  };
}

export function defaultLandingResourcesContent(): LandingResourcesContent {
  return {
    title: "Tài nguyên khác",
    featuredBadge: "Dành cho người mới",
    featuredTitle: "Bạn chưa quen với VibeCoding?",
    featuredDescription:
      "Cẩm nang VibeCoding này là hướng dẫn tổng thể để bạn bắt đầu, xây dựng và triển khai sản phẩm của mình.",
    handbookUrl: LANDING_VIBE_HANDBOOK_URL,
    guideUrl: LANDING_VIBE_GUIDE_URL,
    gridTitle: "Sẵn sàng làm chủ công nghệ?",
    gridDescription:
      "Nghiên cứu ngay các tài liệu dưới đây để mở rộng kỹ năng và hoàn thiện giải pháp:",
    links: [...LANDING_RESOURCE_LINKS],
  };
}

export const LANDING_RESOURCE_LINKS: readonly LandingResourceLink[] = [
  {
    label: "What is Google AI Studio?",
    url: "https://www.youtube.com/watch?v=Y6ufrXn_cZs&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7",
    icon: "▶️",
  },
  {
    label: "Prompting in Google AI Studio",
    url: "https://www.youtube.com/watch?v=pJk33RMGjsk&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=3",
    icon: "▶️",
  },
  {
    label: "Multi-modal Capabilities",
    url: "https://www.youtube.com/watch?v=auJzb1D-fag&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=3",
    icon: "▶️",
  },
  {
    label: "Prototyping in Google AI Studio",
    url: "https://www.youtube.com/watch?v=KUrHeIa3kYE&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=4",
    icon: "▶️",
  },
  {
    label: "Integrating Advance AI in Your Apps",
    url: "https://www.youtube.com/watch?v=P68moBUMFOg&list=PLIivdWyY5sqIagw3_50GeVHIwcUoOwTa7&index=5",
    icon: "▶️",
  },
  {
    label: "Vibe Code with Gemini",
    url: "https://codelabs.developers.google.com/vibe-code-with-gemini-in-aistudio?hl=en#0",
    icon: "💻",
  },
  {
    label: "Deploy from AI Studio to Cloud Run",
    url: "https://codelabs.developers.google.com/deploy-from-aistudio-to-run?hl=en#0",
    icon: "☁️",
  },
  {
    label: "The Starter Tier Explained",
    url: "https://cloud.google.com/blog/topics/developers-practitioners/the-starter-tier-for-google-ai-studio-explained",
    icon: "📰",
  },
];
