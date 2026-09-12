import { requireUser } from "@/lib/auth/guards";
import { submissionStatusLabel } from "@/lib/status-labels";
import { getOrCreateAudition } from "@/server/services/submission-service";
import { AuditionForm } from "@/components/forms/audition-form";
import { Card } from "@/components/ui/form";

export default async function Page() {
  const user = await requireUser();
  let payload: Awaited<ReturnType<typeof getOrCreateAudition>> | null = null;
  let errorMessage: string | null = null;
  try {
    payload = await getOrCreateAudition(user.id);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Không mở được form nộp bài.";
  }
  if (!payload) {
    return (
      <div>
        <h1 className="display text-3xl">Bài Audition</h1>
        <p className="mt-4">{errorMessage}</p>
      </div>
    );
  }
  const { competition, submission } = payload;
  const version = submission.currentVersion;
  return (
    <div>
      <h1 className="display text-3xl">Bài Audition</h1>
      <p className="mt-2 text-sm text-slate-600">
        Trạng thái: {submissionStatusLabel(submission.status)}. Autosave khi rời ô nhập. Các trường có dấu * là
        bắt buộc khi nộp bài. Liên kết phải bắt đầu bằng https:// hoặc http://.
      </p>
      <Card className="mt-6">
        <AuditionForm
          initialStatus={submission.status}
          settings={{
            auditionVideoMode: competition.settings.auditionVideoMode,
            auditionVideoRequired: competition.settings.auditionVideoRequired,
            demoUrlRequired: competition.settings.demoUrlRequired,
            repositoryUrlRequired: competition.settings.repositoryUrlRequired,
            documentUploadRequired: competition.settings.documentUploadRequired,
            promptLogRequired: competition.settings.promptLogRequired,
          }}
          values={{
            submissionTitle: version?.submissionTitle ?? "",
            problemStatement: version?.problemStatement ?? "",
            targetUsers: version?.targetUsers ?? "",
            solutionSummary: version?.solutionSummary ?? "",
            expectedImpact: version?.expectedImpact ?? "",
            geminiUsageSummary: version?.geminiUsageSummary ?? "",
            promptingProcessSummary: version?.promptingProcessSummary ?? "",
            technicalApproach: version?.technicalApproach ?? "",
            introVideoUrl: version?.introVideoUrl ?? "",
            deployedDemoUrl: version?.deployedDemoUrl ?? "",
            repositoryUrl: version?.repositoryUrl ?? "",
            originalityDeclaration: String(version?.originalityDeclaration ?? false),
          }}
        />
      </Card>
    </div>
  );
}
