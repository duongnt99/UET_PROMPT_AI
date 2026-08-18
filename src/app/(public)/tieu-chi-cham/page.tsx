import { getPublishedPage } from "@/server/services/content-service";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getActiveRubric } from "@/server/services/review-service";
import { Card } from "@/components/ui/form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tiêu chí chấm" };

const STAGE_LABEL = {
  AUDITION: "Vòng Audition",
  FINAL: "Vòng chung kết",
} as const;

export default async function Page() {
  const competition = await getProductionCompetition();
  const [article, audition, finals] = await Promise.all([
    getPublishedPage("tieu-chi-cham"),
    competition ? getActiveRubric(competition.id, "AUDITION") : null,
    competition ? getActiveRubric(competition.id, "FINAL") : null,
  ]);
  const intro = article;
  const rubrics = [
    { stage: "AUDITION" as const, rubric: audition },
    { stage: "FINAL" as const, rubric: finals },
  ].filter((item) => item.rubric);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="display text-4xl">{intro?.title ?? "Tiêu chí chấm"}</h1>
      {intro?.bodyMarkdown ? (
        <Card className="mt-6 whitespace-pre-wrap leading-7 text-slate-700">{intro.bodyMarkdown}</Card>
      ) : (
        <p className="mt-2 text-slate-600">Trọng số lấy từ rubric đang kích hoạt.</p>
      )}

      <div className="mt-10 space-y-10">
        {rubrics.map(({ stage, rubric }) => (
          <section key={stage}>
            <h2 className="display text-2xl">{STAGE_LABEL[stage]}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {rubric!.name} · v{rubric!.versionNumber}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {rubric!.criteria.map((criterion) => (
                <Card key={criterion.id}>
                  <p className="text-sm text-amber-700">{criterion.weight.toString()}%</p>
                  <h3 className="text-xl font-semibold">{criterion.titleVi}</h3>
                  {criterion.description ? (
                    <p className="mt-2 text-sm text-slate-600">{criterion.description}</p>
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
