# Security checklist

- [x] Server-side authorization (proxy + layout + services)
- [x] Secure session cookie via Auth.js
- [x] Zod validation on actions
- [x] Rate limit login/register/reset/upload
- [x] Signed private file URLs
- [x] Block executables
- [x] Security headers + CSP; overlay frame-ancestors *
- [x] No secret logging
- [x] Audit role/status/score/export/settings
- [x] Private routes noindex
- [x] Public APIs sanitized (no email/phone)
- [x] Reviewer notes not on participant dashboard
- [x] Scores hidden until publish flags
