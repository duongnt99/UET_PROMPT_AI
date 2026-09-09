import { getPublishedPage } from "@/server/services/content-service";
import { FormattedText } from "@/components/public/formatted-text";
import { Card } from "@/components/ui/form";

export async function CmsArticle({ slug, fallbackTitle, fallback }: { slug: string; fallbackTitle: string; fallback: string }) {
  const page = await getPublishedPage(slug);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl">{page?.title ?? fallbackTitle}</h1>
      <Card className="mt-6">
        <FormattedText text={page?.bodyMarkdown ?? fallback} className="leading-7 text-slate-700" />
      </Card>
    </div>
  );
}
