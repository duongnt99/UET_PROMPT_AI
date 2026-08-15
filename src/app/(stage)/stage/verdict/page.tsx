import { requireAnyRole } from "@/lib/auth/guards";
export default async function Page() {
  await requireAnyRole(["ADMIN", "SUPER_ADMIN", "TECH_OPERATOR"]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1F3A] text-white">
      <h1 className="display text-6xl">The Verdict</h1>
    </div>
  );
}
