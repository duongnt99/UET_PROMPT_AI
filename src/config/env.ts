import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(16).default("dev-auth-secret-change-me-32ch"),
  DATABASE_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  EMAIL_FROM: z.string().default("Prompt-Off Vietnam <noreply@promptoff.local>"),
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
  ALLOW_EMAIL_IN_REHEARSAL: z.string().optional(),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
