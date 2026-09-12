import { getProductionCompetition } from "@/server/services/competition-service";
import { isValidHttpUrl } from "@/lib/utils";
import { Card } from "@/components/ui/form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Livestream" };

export default async function Page() {
  const competition = await getProductionCompetition();
  const settings = competition?.settings;
  const canEmbed =
    Boolean(settings?.livestreamEnabled) &&
    Boolean(settings?.livestreamUrl) &&
    isValidHttpUrl(settings?.livestreamUrl ?? "") &&
    settings?.livestreamStatus === "LIVE";
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="display text-4xl">Livestream</h1>
      {!canEmbed ? (
        <Card className="mt-6">Livestream chưa được bật hoặc đường dẫn chưa được công bố.</Card>
      ) : (
        <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe title="Livestream AI Arena Viet Nam" src={settings!.livestreamUrl} className="h-full w-full" allowFullScreen />
        </div>
      )}
    </div>
  );
}
