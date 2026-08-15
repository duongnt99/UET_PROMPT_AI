import { Card } from "@/components/ui/form";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/guards";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const user = await requireUser();
  const { token } = await searchParams;
  if (!token) {
    return <Card className="mx-auto mt-16 max-w-md">Thiếu token lời mời.</Card>;
  }
  const invitation = await prisma.staffInvitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return <Card className="mx-auto mt-16 max-w-md">Lời mời không hợp lệ hoặc hết hạn.</Card>;
  }
  await prisma.$transaction([
    prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date(), userId: user.id },
    }),
    prisma.roleAssignment.create({ data: { userId: user.id, role: invitation.role } }),
  ]);
  return <Card className="mx-auto mt-16 max-w-md">Đã nhận vai trò {invitation.role}.</Card>;
}
