import { requireUser } from "@/lib/auth/guards";
import { acceptTeamInvitation } from "@/server/services/registration-service";
import { Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const user = await requireUser();
  const { token } = await searchParams;
  return (
    <div className="px-4 py-16">
      <Card className="mx-auto max-w-md">
        <h1 className="display text-2xl">Lời mời vào đội</h1>
        <form
          action={async () => {
            "use server";
            if (!token) return;
            await acceptTeamInvitation({ userId: user.id, token });
            redirect("/dashboard/doi-thi");
          }}
        >
          <Button type="submit" className="mt-4">Chấp nhận lời mời</Button>
        </form>
      </Card>
    </div>
  );
}
