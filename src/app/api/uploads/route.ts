import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { putObject } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";
import { getProductionCompetition } from "@/server/services/competition-service";
import { isForbiddenUpload } from "@/server/domain/submission-rules";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await requireUser();
  const limit = await consumeRateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const competition = await getProductionCompetition();
  if (!competition) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "missing_file" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const check = isForbiddenUpload({
    filename: file.name,
    mimeType: file.type,
    allowedMimeTypes: competition.settings.allowedUploadMimeTypes,
    maxBytes: competition.settings.maxUploadSizeMb * 1024 * 1024,
    sizeBytes: buffer.length,
  });
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 400 });
  const stored = await putObject({
    body: buffer,
    contentType: file.type,
    filename: file.name,
    prefix: `${competition.id}/${user.id}`,
  });
  const asset = await prisma.fileAsset.create({
    data: {
      competitionId: competition.id,
      ownerUserId: user.id,
      bucket: stored.bucket,
      objectKey: stored.objectKey,
      originalFilename: file.name,
      contentType: file.type,
      sizeBytes: buffer.length,
      kind: "OTHER",
      visibility: "PRIVATE",
    },
  });
  return NextResponse.json({ id: asset.id });
}
