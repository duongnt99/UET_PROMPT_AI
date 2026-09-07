import { getPublicHomeData } from "@/server/services/content-service";
import { Card } from "@/components/ui/form";
import type { Metadata } from "next";
import { FormattedText } from "@/components/public/formatted-text";
export const metadata: Metadata = { title: "FAQ" };
export default async function Page() {
  const data = await getPublicHomeData();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display text-4xl">Câu hỏi thường gặp</h1>
      <div className="mt-8 space-y-4">
        {(data?.faqs ?? []).map((faq) => (
          <Card key={faq.id}>
            <h2 className="font-semibold">{faq.question}</h2>
            <FormattedText text={faq.answerMarkdown} className="mt-2 leading-7 text-slate-600" />
          </Card>
        ))}
      </div>
    </div>
  );
}
