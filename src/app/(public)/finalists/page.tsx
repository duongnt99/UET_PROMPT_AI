import { getProductionCompetition } from "@/server/services/competition-service";
import { listPublishedFinalists } from "@/server/services/finalist-service";
import { Card } from "@/components/ui/form";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Finalists" };

export default async function Page() {
  const competition = await getProductionCompetition();
  const enabled = competition?.settings.finalistPublicationEnabled;
  const items =
    competition && enabled ? await listPublishedFinalists(competition.id) : [];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="display text-4xl">Danh sách vào chung kết</h1>
      {!items.length ? (
        <p className="mt-6 text-slate-600">Danh sách finalist chưa được công bố.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <p className="text-xs text-slate-500">Seed {item.seed ?? "—"}</p>
              <h2 className="text-xl font-semibold">{item.displayName}</h2>
              <p className="text-sm text-slate-600">{item.institutionPublic ?? ""}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
