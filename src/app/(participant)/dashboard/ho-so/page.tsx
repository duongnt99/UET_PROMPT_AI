import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { ProfileForm } from "@/components/forms/profile-form";

export default async function Page() {
  const user = await requireUser();
  const profile = await prisma.participantProfile.findUnique({ where: { userId: user.id } });
  return (
    <div>
      <h1 className="display text-3xl">Hồ sơ cá nhân</h1>
      <div className="mt-6">
        <ProfileForm
          profile={{
            fullName: profile?.fullName || user.name || "",
            phoneNumber: profile?.phoneNumber,
            institution: profile?.institution,
            facultyOrDepartment: profile?.facultyOrDepartment,
            major: profile?.major,
            studentId: profile?.studentId,
            academicYear: profile?.academicYear,
            provinceOrCity: profile?.provinceOrCity,
            shortBio: profile?.shortBio,
          }}
        />
      </div>
    </div>
  );
}
