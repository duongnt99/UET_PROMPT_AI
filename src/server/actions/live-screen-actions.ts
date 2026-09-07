"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { validateViewerAccess } from "@/server/services/live-screen-service";

const commentSchema = z.object({
  contestSessionId: z.string().min(1),
  registrationId: z.string().min(1),
  content: z.string().trim().min(1, "Vui lòng nhập nội dung.").max(2_000, "Bình luận tối đa 2.000 ký tự."),
});

export type LiveCommentResult = {
  ok: boolean;
  message: string;
  comment?: { id: string; content: string; authorName: string; createdAt: string };
};

export async function addLiveCommentAction(input: {
  contestSessionId: string;
  registrationId: string;
  content: string;
}): Promise<LiveCommentResult> {
  try {
    const user = await requirePermission("operations:control");
    const parsed = commentSchema.parse(input);
    const { registration } = await validateViewerAccess({
      roles: user.roles,
      contestSessionId: parsed.contestSessionId,
      registrationId: parsed.registrationId,
    });
    const note = await prisma.internalNote.create({
      data: {
        registrationId: registration.id,
        contestSessionId: parsed.contestSessionId,
        authorId: user.id,
        body: parsed.content,
      },
      include: { author: true },
    });
    revalidatePath(`/admin/bracket/${parsed.contestSessionId}/theo-doi/${parsed.registrationId}`);
    return {
      ok: true,
      message: "Đã lưu bình luận.",
      comment: {
        id: note.id,
        content: note.body,
        authorName: note.author.name || note.author.email,
        createdAt: note.createdAt.toISOString(),
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Không lưu được bình luận." };
  }
}
