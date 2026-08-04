# Profile tab (mobile)

Carded settings hub under **Profile** (`mobile/app/(tabs)/settings.tsx` + `mobile/app/profile/*`).

## Workspace split
Personal and Business are separate realms (ledgers, banks, insights, exports). They share UX patterns and a user account—not data.
- **Personal:** hero = name + personal email. Personal banks only. No Business tools / Stripe / accountant cards.
- **Business:** hero = name + business name + business email. Business banks only. Details include EIN. Stripe Connect + accountant invites.

## Live today
- Edit name / email / password (`PATCH /api/auth/profile`, `POST /api/auth/password`)
- Default Personal/Business mode sync to `User.defaultMode`
- Business name + business email (`User.businessName`, `User.businessEmail`)
- Receipt cloud-backup preference (+ pros/cons copy)
- Security: sessions list, last sign-in, biometric lock toggle (device-local)
- AI memory vault (list + delete)
- Ledger CSV export (`GET /api/export/ledger`) with IRS retention guidance
- Appearance (light/dark), notifications prefs + Expo push token registration
- Delete account (`DELETE /api/auth/account`)
- **Stripe:** Pro Checkout (`POST /api/stripe/checkout`), Customer Portal, Connect (Business-only, `workspace: "business"`), webhook plan sync
- **Plaid:** Hosted Link, sync → bank inbox on Home, cash pulse diagram, accept/ignore triage; see `docs/BANK_CONNECTIVITY.md` (Pro intelligence teasers only)
- **Push:** `POST /api/push/weekly-review` (self test or `CRON_SECRET`)
- **Accountant:** create/list/revoke invites; accept page at `/accountant/accept`

## Env
See `.env.example` for `STRIPE_*`, `PLAID_*`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`.

## Compliance notes
Export and Privacy screens cite IRS Pub. 583 / record retention (generally 3+ years; employment taxes 4+). Not legal advice—point users to [IRS: How long should I keep records?](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records).
