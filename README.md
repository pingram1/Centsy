# Centsy

AI-powered personal and business finance tracker — **mobile-first**, backed by a live PostgreSQL ledger and **Centsy AI** (OpenRouter + RAG).

## Stack

- **Web:** Next.js App Router, Tailwind, shadcn/ui
- **Mobile:** Expo Go (SDK 54) in `mobile/`
- **Auth:** Email/password sessions (httpOnly cookie + Bearer token for Expo)
- **DB:** PostgreSQL via Prisma
- **AI:** OpenRouter LLM + retrieval over live user transactions

## Setup

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL and OPENROUTER_API_KEY

npx prisma migrate dev --name init_live
npm run dev
```

Create your real account at `/signup`, then use Snap / dashboard / `/ai`.

### Expo Go

```bash
cd mobile && npm install
# mobile/.env → EXPO_PUBLIC_API_URL=http://<lan-ip>:3000
npm start   # or: npm run mobile from repo root
```

Sign in from the **You** tab.

## Centsy AI

- UI: `/ai` (web) and `mobile/app/ai.tsx`
- API: `GET/POST /api/ai/chat`
- Architecture notes: [`docs/CENTSY_AI.md`](docs/CENTSY_AI.md)

RAG always loads Personal **and** Business summaries plus recent transactions so questions like “compare my modes” work.

## Simulation / agent testing

Four personas (single mom, CEO, college student, couple + dog):

```bash
npm run sim:seed -- --all
npm run sim:eval -- --persona college_student
```

Details: [`scripts/simulation/README.md`](scripts/simulation/README.md)

## Key paths

| Area | Path |
|------|------|
| Prisma schema | `prisma/schema.prisma` |
| Auth | `src/lib/auth.ts`, `src/app/api/auth/*` |
| Dashboard API | `src/app/api/dashboard` |
| Centsy AI RAG | `src/lib/centsy-ai/` |
| Shared types | `shared/` |
| Expo client | `mobile/` |
