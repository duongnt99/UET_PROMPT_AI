type LogFields = Record<string, unknown>;

const SECRET_KEYS = [
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "secret",
  "authorization",
  "cookie",
  "AUTH_SECRET",
  "S3_SECRET_ACCESS_KEY",
  "SMTP_PASSWORD",
  "CRON_SECRET",
];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
        if (SECRET_KEYS.some((secret) => key.toLowerCase().includes(secret.toLowerCase()))) {
          return [key, "[redacted]"];
        }
        return [key, redact(nested)];
      }),
    );
  }
  return value;
}

function write(level: string, message: string, fields?: LogFields) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(fields ? { fields: redact(fields) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else console.info(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
