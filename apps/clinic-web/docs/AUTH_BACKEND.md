# Clinic auth — backend endpoints still required

Clinic Web currently runs with an **isolated DEV mock** (`lib/auth/mock-auth-service.ts`) when `NEXT_PUBLIC_API_URL` is unset.

When the NestJS (or compatible) API is ready, set `NEXT_PUBLIC_API_URL` and implement:

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/clinic/register` | Unique email+phone; send email OTP; no admin approval; do **not** start trial yet |
| POST | `/auth/email/verify` | Hash OTP (never store plain); TTL 10m; on success: `emailVerifiedAt`, `accountStatus=active`, `subscriptionStatus=trial`, `trialStartedAt=now`, `trialEndsAt=now+30d` |
| POST | `/auth/email/resend` | Invalidate previous OTP; 60s cooldown; rate limit |
| POST | `/auth/login` | Body `{ identifier, password }` — email **or** phone |
| POST | `/auth/logout` | Invalidate refresh/session |
| POST | `/auth/forgot-password` | Email only (no SMS) |
| POST | `/auth/reset-password` | Email OTP + new password |
| GET | `/auth/me` | Current clinic admin + subscription |
| PATCH | `/auth/onboarding` | `{ step, completed }` |
| GET | `/subscription/status` | Trial days remaining (server time) |

## Security requirements

- Passwords: Argon2 or bcrypt (never plaintext)
- OTP: cryptographically secure 6-digit, store hash only, one-time, invalidate on success/resend
- Rate limit: register, login, verify, resend
- Session: httpOnly secure cookies or access+refresh tokens (prefer cookies for web)
- SMTP via env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Production: never log OTP to console

## Domain fields

```
subscriptionStatus: trial | active | expired | blocked
trialStartedAt, trialEndsAt
subscriptionStartedAt, subscriptionEndsAt
marketplaceBookingEnabled
```

Manual Super Admin activation (30/90/365 days) can come later — keep status model ready.

## Email templates

Subject: `DENTA.UZ — Email manzilingizni tasdiqlang`  
Also prepare: password reset, trial reminders (7 / 3 / 1 / expired).
