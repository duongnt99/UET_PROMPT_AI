import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/config/env";
import { sanitizeObjectKey } from "@/lib/utils";

function client() {
  const env = getEnv();
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE !== "false",
    maxAttempts: 1,
    credentials:
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export async function storageHealth(): Promise<"ok" | "error"> {
  const endpoint = getEnv().S3_ENDPOINT;
  if (!endpoint) return "error";
  try {
    const response = await fetch(endpoint, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });
    return response.status < 500 ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function putObject(params: {
  body: Buffer;
  contentType: string;
  filename: string;
  prefix: string;
}) {
  const env = getEnv();
  const objectKey = `${params.prefix}/${sanitizeObjectKey(params.filename)}`;
  await client().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
      Body: params.body,
      ContentType: params.contentType,
      ACL: undefined,
    }),
  );
  return { bucket: env.S3_BUCKET, objectKey };
}

export async function signedGetUrl(objectKey: string, expiresIn = 120) {
  const env = getEnv();
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }),
    { expiresIn },
  );
}

export async function deleteObject(objectKey: string) {
  const env = getEnv();
  await client().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }));
}
