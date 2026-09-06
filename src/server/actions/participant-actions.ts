"use server";

import { nanoid } from "nanoid";
import {
  acceptTeamInvitation,
  createRegistrationDraft,
  declineTeamInvitation,
  saveProfile,
  submitRegistration,
  inviteTeamMember,
} from "@/server/services/registration-service";
import { requireUser } from "@/lib/auth/guards";
import { autosaveAudition, submitAudition } from "@/server/services/submission-service";
import { revalidatePath } from "next/cache";

export async function createRegistrationAction(formData: FormData) {
  const user = await requireUser();
  const type = String(formData.get("type")) as "INDIVIDUAL" | "TEAM";
  const teamName = String(formData.get("teamName") ?? "");
  try {
    await createRegistrationDraft({ userId: user.id, type, teamName });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không tạo được hồ sơ." };
  }
}

export async function saveProfileAction(formData: FormData) {
  const user = await requireUser();
  await saveProfile({
    userId: user.id,
    data: {
      fullName: String(formData.get("fullName") ?? ""),
      phoneNumber: String(formData.get("phoneNumber") ?? ""),
      institution: String(formData.get("institution") ?? ""),
      facultyOrDepartment: String(formData.get("facultyOrDepartment") ?? ""),
      major: String(formData.get("major") ?? ""),
      studentId: String(formData.get("studentId") ?? ""),
      academicYear: String(formData.get("academicYear") ?? ""),
      provinceOrCity: String(formData.get("provinceOrCity") ?? ""),
      shortBio: String(formData.get("shortBio") ?? ""),
    },
  });
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function inviteMemberAction(formData: FormData) {
  const user = await requireUser();
  try {
    await inviteTeamMember({ actorUserId: user.id, email: String(formData.get("email") ?? "") });
    revalidatePath("/dashboard/dang-ky");
    revalidatePath("/dashboard/doi-thi");
    revalidatePath("/dashboard/thong-bao");
    return { ok: true, message: "Đã gửi lời mời trong hệ thống." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không tạo được lời mời." };
  }
}

export async function acceptTeamInvitationAction(formData: FormData) {
  const user = await requireUser();
  try {
    const result = await acceptTeamInvitation({
      userId: user.id,
      invitationId: String(formData.get("invitationId") ?? ""),
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/doi-thi");
    revalidatePath("/dashboard/dang-ky");
    revalidatePath("/dashboard/thong-bao");
    return { ok: true, message: `Đã tham gia đội ${result.teamName}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không chấp nhận được lời mời." };
  }
}

export async function declineTeamInvitationAction(formData: FormData) {
  const user = await requireUser();
  try {
    const result = await declineTeamInvitation({
      userId: user.id,
      invitationId: String(formData.get("invitationId") ?? ""),
    });
    revalidatePath("/dashboard/doi-thi");
    revalidatePath("/dashboard/thong-bao");
    return { ok: true, message: `Đã từ chối lời mời vào đội ${result.teamName}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không từ chối được lời mời." };
  }
}

export async function submitRegistrationAction(formData: FormData) {
  const user = await requireUser();
  try {
    const result = await submitRegistration({
      userId: user.id,
      consents: {
        consentToRules: formData.get("consentToRules") === "on",
        consentToDataProcessing: formData.get("consentToDataProcessing") === "on",
        consentToPublicFinalistProfile: formData.get("consentToPublicFinalistProfile") === "on",
      },
      idempotencyKey: String(formData.get("idempotencyKey") || nanoid()),
    });
    return result;
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Nộp hồ sơ thất bại." };
  }
}

export async function autosaveAuditionAction(formData: FormData) {
  const user = await requireUser();
  const data = Object.fromEntries(formData.entries());
  await autosaveAudition({
    userId: user.id,
    data: {
      ...data,
      originalityDeclaration: formData.get("originalityDeclaration") === "on",
      permissionToReviewPrivateLinks: formData.get("permissionToReviewPrivateLinks") === "on",
    },
  });
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function submitAuditionAction(formData: FormData) {
  const user = await requireUser();
  try {
    const result = await submitAudition({
      userId: user.id,
      idempotencyKey: String(formData.get("idempotencyKey") || nanoid()),
    });
    return result;
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Nộp bài thất bại." };
  }
}
