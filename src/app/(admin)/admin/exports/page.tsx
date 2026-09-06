import { exportRegistrationsCsv } from "@/server/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/form";

export default function Page() {
  return (
    <div>
      <h1 className="display text-3xl">Xuất dữ liệu</h1>
      <Card className="mt-4">
        <p className="text-sm">Tệp CSV UTF-8. Mọi lần xuất dữ liệu cá nhân đều được ghi vào nhật ký hệ thống.</p>
        <form
          className="mt-4"
          action={async () => {
            "use server";
            const csv = await exportRegistrationsCsv();
            const { redirect } = await import("next/navigation");
            redirect(`/api/admin/export-registrations?inline=1&n=${csv.length}`);
          }}
        >
          <Button type="submit">Xuất danh sách đăng ký</Button>
        </form>
      </Card>
    </div>
  );
}
