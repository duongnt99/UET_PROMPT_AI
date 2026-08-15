# Operations

- Mailpit: http://localhost:8025
- MinIO console: http://localhost:9001
- Prisma studio: `pnpm db:studio`
- Process outbox: `pnpm email:outbox`
- Maintenance: bật `maintenanceMode` trong settings
- Rehearsal: competition `isRehearsal=true`; không gửi email thật trừ `ALLOW_EMAIL_IN_REHEARSAL=true`
