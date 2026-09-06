import { prisma } from "@/lib/db/prisma";

export async function notifyUser(params: {
  id?: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  const data = {
    userId: params.userId,
    title: params.title,
    body: params.body,
    href: params.href,
  };
  if (!params.id) return prisma.notification.create({ data });
  return prisma.notification.upsert({
    where: { id: params.id },
    update: data,
    create: { id: params.id, ...data },
  });
}
