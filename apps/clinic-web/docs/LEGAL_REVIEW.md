# DENTA.UZ legal documents — review checklist

Public pages: `/terms` (Foydalanish shartlari) and `/privacy` (Maxfiylik siyosati).

The texts are written for DENTA.UZ, but a lawyer must confirm the items below
before production launch. Nothing in this list is shown to users as "TODO":
unset operator fields fall back to neutral wording, and the rest are phrased
so they defer to the contract / commercial offer / law.

## Where things live

| What | Where |
| --- | --- |
| Uzbek (Latin) official text | `lib/legal/content/terms.uz.ts`, `lib/legal/content/privacy.uz.ts` |
| Locale registry + fallback | `lib/legal/index.ts` (`BUILDERS`) |
| Versions, dates, operator, billing numbers | `lib/legal/constants.ts` (env overrides) |
| Machine-readable checklist | `LEGAL_REVIEW_FIELDS` in `lib/legal/constants.ts` |
| Page UI | `components/legal/LegalDocumentView.tsx` |
| Consent record (API) | Prisma `LegalConsent`, written in `AuthService.registerClinic` |

## Fields still needed from legal / business

- [ ] **Operator legal name** → `NEXT_PUBLIC_LEGAL_OPERATOR_NAME`
- [ ] **STIR / company registration details** → `NEXT_PUBLIC_LEGAL_OPERATOR_TIN`
- [ ] **Legal address** → `NEXT_PUBLIC_LEGAL_OPERATOR_ADDRESS`
- [ ] **Support email** → `NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL`
- [ ] **Privacy / personal-data contact email** → `NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL`
- [ ] **Governing law wording** — terms section `disputes`
- [ ] **Dispute jurisdiction** (court / arbitration venue, pre-trial claim period) — terms section `disputes`
- [ ] **Exact retention periods** (medical records, accounting, audit logs, backups) — privacy section `retention`
- [ ] **Late-payment penalty formula** — only in the service agreement / commercial offer; the Terms only reference it
- [ ] **Grace / suspension days** — defaults 5 / 30 via `NEXT_PUBLIC_LEGAL_GRACE_DAYS`, `NEXT_PUBLIC_LEGAL_SUSPENSION_DAYS`
- [ ] **Liability cap wording** — terms section `liability` (currently: subscription fee paid for the month of damage)
- [ ] **Refund policy** — terms sections `subscription`, `termination`
- [ ] **Minors: age threshold and guardian-consent rules** — privacy section `minors`
- [ ] **Personal-data storage location / localization compliance** — privacy section `security`
- [ ] **Infrastructure facts** stated in privacy `security`: production HTTPS/TLS and database backups must be true for the deployed environment

## Changing a document

1. Edit the content module.
2. Bump the version in **both** apps so they stay equal:
   - clinic-web: `NEXT_PUBLIC_LEGAL_TERMS_VERSION` / `NEXT_PUBLIC_LEGAL_PRIVACY_VERSION`
   - API: `LEGAL_TERMS_VERSION` / `LEGAL_PRIVACY_VERSION`
3. Update `NEXT_PUBLIC_LEGAL_UPDATED_DATE` (and `NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE` if it changes).

If the web and API versions differ, the API rejects registration with
`LEGAL_CONSENT_REQUIRED` (`details.outdated = true`) and the form asks the user
to refresh.

## Adding a translation

Create e.g. `lib/legal/content/terms.ru.ts` exporting a `LegalDocumentBuilder`,
keep the same section `id`s (they are public anchors), and register it in
`BUILDERS`. Until then, other locales render the Uzbek text with a notice.

## Rules for the text

- No approximate article numbers of laws.
- No penalty percentage unless it is in a signed contract / commercial offer.
- No absolute security guarantees; no promise of immediate full deletion.
- DENTA.UZ is a software platform, not a medical provider; clinics and doctors
  are responsible for medical decisions.
- Third parties: describe only services actually used (SMTP, Firebase Cloud
  Messaging, Google Maps, S3-compatible storage, hosting, monitoring). Payment
  providers are described only as a possible future addition.
