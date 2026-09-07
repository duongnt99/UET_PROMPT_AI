import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(16).default("dev-auth-secret-change-me-32ch"),
  DATABASE_URL: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("promptoff"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  ADMIN_SEED_EMAIL: z.string().optional(),
  ADMIN_SEED_PASSWORD: z.string().optional(),
  SEED_PASSWORD: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  CAPTCHA_ENABLED: z.string().optional(),
  WEBRTC_STUN_URLS: z.string().default("stun:stun.l.google.com:19302"),
  WEBRTC_TURN_URLS: z.string().optional(),
  WEBRTC_TURN_USERNAME: z.string().optional(),
  WEBRTC_TURN_CREDENTIAL: z.string().optional(),
  LIVE_SCREEN_ALLOWED_ORIGINS: z.string().optional(),
  LIVE_SCREEN_DISCONNECT_GRACE_SECONDS: z.coerce.number().int().min(5).max(60).default(12),
  EMAIL_PROVIDER: z.preprocess((value) => value === "" ? undefined : value, z.enum(["console", "resend", "smtp"]).optional()),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional()),
  EMAIL_FROM_NAME: z.string().default("AI Arena Vietnam"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  EMAIL_SEND_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
  EMAIL_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
  EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  EMAIL_WORKER_INTERVAL_MS: z.coerce.number().int().min(1000).max(300000).default(5000),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
