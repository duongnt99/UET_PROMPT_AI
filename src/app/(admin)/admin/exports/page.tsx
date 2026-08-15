import { exportRegistrationsCsv } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/form";

export default function Page() {
  return (
    <div>
      <h1 className="display text-3xl">Export</h1>
      <Card className="mt-4">
        <p className="text-sm">CSV UTF-8 BOM. Mọi export PII được ghi audit.</p>
        <form
          className="mt-4"
          action={async () => {
            "use server";
            const csv = await exportRegistrationsCsv();
            const { redirect } = await import("next/navigation");
            redirect(`/api/admin/export-registrations?inline=1&n=${csv.length}`);
          }}
        >
          <Button type="submit">Export đăng ký (qua API)</Button>
        </form>
      </Card>
    </div>
  );
}
