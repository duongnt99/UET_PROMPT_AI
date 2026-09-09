# Dependency Vulnerability Assessment

**Audit date:** 2026-09-08  
**Tool:** `pnpm audit`  
**Total:** 7 HIGH (all transitive)

**Policy:** Do not run `pnpm audit fix` blindly. Patch in a separate PR with full CI.

---

## Summary Table

| Package | Severity | Path | Patched | Runtime reachable? | Classification |
|---------|----------|------|---------|-------------------|----------------|
| fast-uri | HIGH | `@hookform/resolvers → ajv → fast-uri` | >=3.1.6 | Indirect (form validation) | PATCH THIS WEEK |
| fast-uri | HIGH | (multiple CVE IDs) | >=3.1.6 | Same | PATCH THIS WEEK |
| effect | HIGH | `prisma → @prisma/config → effect` | 3.19.15+ | Build/CLI only (Prisma migrate) | LOW PRACTICAL RISK |
| deepmerge-ts | HIGH | `prisma → @prisma/config → deepmerge-ts` | TBD | Build/CLI only | LOW PRACTICAL RISK |
| nodemailer | HIGH | direct dependency | TBD | Yes (SMTP email path) | PATCH THIS WEEK |

---

## Detailed Assessment

### fast-uri (GHSA — host confusion)

- **Used for:** JSON schema validation via `ajv` in `@hookform/resolvers`
- **Production exposure:** Server-side form validation on registration/admin forms
- **Exploitability:** Low–medium; requires crafted input through validated forms
- **Action:** Update lockfile when `fast-uri >= 3.1.6` resolves via dependency chain
- **Classification:** **PATCH THIS WEEK**

### effect (GHSA-38f7-945m-qr2g — ALS context mixing)

- **Used for:** Prisma 6 internal config (`@prisma/config`)
- **Production exposure:** `prisma migrate deploy` at deploy time only; not in HTTP request path
- **Exploitability:** Very low in this app (no Effect RPC handlers, no `toWebHandlerRuntime`)
- **Classification:** **LOW PRACTICAL RISK** — monitor Prisma updates

### deepmerge-ts

- **Used for:** Prisma config merge
- **Production exposure:** CLI/build time only
- **Classification:** **LOW PRACTICAL RISK**

### nodemailer

- **Used for:** SMTP email provider (`src/server/email/`)
- **Production exposure:** High when `EMAIL_PROVIDER=smtp` configured; currently email not configured in production
- **Classification:** **PATCH THIS WEEK** (before enabling SMTP)

---

## Recommended Patch Process

```bash
# On development machine (NOT production directly)
pnpm update fast-uri nodemailer  # or wait for upstream lockfile resolution
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Deploy via scripts/deploy.sh after merge to main
```

**Do NOT** patch dependencies in the same change set as server hardening.

---

## MUST PATCH NOW

*None* — no critical RCE in direct production HTTP path identified.

## PATCH THIS WEEK

1. fast-uri (via dependency updates)
2. nodemailer (before SMTP enabled)

## LOW PRACTICAL RISK

1. effect (Prisma transitive)
2. deepmerge-ts (Prisma transitive)

---

## Finding Reference

| ID | Status |
|----|--------|
| SEC-005 | OPEN — documented; patch via separate PR |
