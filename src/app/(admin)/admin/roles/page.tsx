import { Card } from "@/components/ui/form";
export default function Page() {
  return (
    <div>
      <h1 className="display text-3xl">Vai trò</h1>
      <Card className="mt-4">
        SUPER_ADMIN quản lý role. ADMIN không được thay đổi SUPER_ADMIN. Dùng script `pnpm create-super-admin` cho tài khoản đầu tiên.
      </Card>
    </div>
  );
}
