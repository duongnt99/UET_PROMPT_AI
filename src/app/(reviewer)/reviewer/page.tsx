import { requireAnyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card, Badge } from "@/components/ui/form";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page() {
  const user = await requireAnyRole(["REVIEWER", "ADMIN", "SUPER_ADMIN"]);
  const assignments = await prisma.reviewAssignment.findMany({
    where: user.roles.includes("REVIEWER") ? { reviewerId: user.id } : {},
    include: { submission: { include: { currentVersion: true, registration: true } } },
  });
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="display text-3xl">Reviewer</h1>
      <div className="mt-4 space-y-3">
        {assignments.map((item) => (
          <Link key={item.id} href={`/reviewer/${item.id}`}>
            <Card className="flex justify-between">
              <span>{item.submission.currentVersion?.submissionTitle || item.submission.registration.code}</span>
              <Badge>{item.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
