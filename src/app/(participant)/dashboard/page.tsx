import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";
import { getMyRegistration } from "@/server/services/registration-service";
import { Badge, Card } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import { remainingMs } from "@/server/domain/deadlines";

export default async function Page() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { profile: true, notifications: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  const competition = await getProductionCompetition();
  const registration = competition ? await getMyRegistration(user.id, competition.id) : null;
  const close = remainingMs({ now: new Date(), closeAt: competition?.settings.registrationCloseAt });
  return (
    <div className="space-y-6">
      <h1 className="display text-3xl">Xin chào {dbUser.profile?.fullName || dbUser.name}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-semibold">{dbUser.emailVerifiedAt ? "Đã xác minh" : "Chưa xác minh"}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Đăng ký</p>
          <Badge>{registration?.status ?? "Chưa tạo"}</Badge>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Hạn đăng ký</p>
          <p>{competition?.settings.registrationCloseAt ? formatDateTime(competition.settings.registrationCloseAt) : "Đang cập nhật"}</p>
          {close !== null ? <p className="text-xs text-slate-500">Còn {Math.max(0, Math.round(close / 3600000))} giờ</p> : null}
        </Card>
      </div>
      <Card>
        <h2 className="font-semibold">Việc cần làm</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {!dbUser.emailVerifiedAt ? <li>Xác minh email</li> : null}
          {!dbUser.profile?.studentId ? <li>Hoàn thiện mã sinh viên và trường</li> : null}
          {!registration ? <li>Tạo hồ sơ đăng ký</li> : null}
          {registration && registration.status === "DRAFT" ? <li>Nộp hồ sơ đăng ký</li> : null}
        </ul>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href="/dashboard/dang-ky">Hồ sơ đăng ký</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/audition">Audition</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
