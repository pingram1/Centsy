# Centsy simulation & agentic testing

Framework for autonomous sub-agents to simulate users, generate live ledger data, and evaluate **Centsy AI** answers against RAG context.

## Personas

| Id | Description |
|----|-------------|
| `single_mom` | Single mom with two kids |
| `millionaire_ceo` | CEO tracking personal + business |
| `college_student` | Student learning to budget |
| `middle_class_couple` | Dual-income couple with a dog |

Defined in `personas.ts`.

## Prerequisites

```bash
# .env or .env.local
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-...
```

```bash
npx prisma migrate dev
```

## Commands

```bash
# Seed one or all personas into the live DB
npm run sim:seed -- --persona college_student
npm run sim:seed -- --all

# Ask each persona's sample questions via Centsy AI (RAG + OpenRouter)
npm run sim:eval -- --persona college_student
npm run sim:eval -- --all
```

## Agent contract (for future sub-agents)

1. **Select persona** from `personas.ts` (or extend with a new id).
2. **Seed** with `generate-persona-data.ts` (idempotent per email).
3. **Act** (optional): create extra transactions via `POST /api/transactions` using a session from `POST /api/auth/login`.
4. **Ask** Centsy AI via `POST /api/ai/chat` or `run-persona-ai-eval.ts`.
5. **Assert** answers cite merchants/categories present in that user's DB rows (no invented txns).

## RAG context contract

`retrieveUserContext(userId, mode)` always loads:

- User `aiProfile` + `AiMemory` rows
- Personal **and** Business month-to-date summaries
- Last ~80 transactions (6 months), biased to active mode
- Recent mileage logs

The LLM system prompt forbids inventing transactions outside this context.
