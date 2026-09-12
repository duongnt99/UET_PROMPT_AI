import type { CompetitionSettings } from "@/config/competition-settings";

export function formatPublicBrandName(settings: Pick<CompetitionSettings, "landingHeroTitle" | "landingHeroHighlight" | "season">) {
  const title = settings.landingHeroTitle.trim().replace(/:+$/, "");
  const highlight = settings.landingHeroHighlight.trim();
  const season = settings.season.trim();
  return `${title}: ${highlight} ${season}`.replace(/\s+/g, " ").trim();
}
