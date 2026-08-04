# Centsy AI — architecture

Centsy AI is the interactive brain of the app. It answers natural-language questions about a user’s **live** Personal/Business activity and coaches habits using retrieval-augmented generation (RAG). Bank inbox suggestions are also produced by the same brain so categorization evolves in real time as you Accept / correct charges.

## Cognitive learning model

Centsy AI follows predictive-processing style learning (see `CENTSY_SYSTEM_PROMPT` in `src/lib/centsy-ai/rag.ts`):

| Principle | Behavior in product |
|-----------|---------------------|
| Predictive processing | Every inbox row gets a category prediction before Accept |
| Prediction error | Your Accept category is written to `AiMemory` (`merchant_cat:*`) and overrides priors |
| Synaptic plasticity | Repeat Accepts lock a merchant pathway; do not re-ask unless amount/frequency spikes |
| Pruning | History older than ~6 months is weak; recent repeats dominate |
| Associative learning | Novel merchants map onto existing habit networks / rule packs |
| Precision weighting | Low-precision (noisy/large/unknown) suggestions are highlighted in the inbox |
| Metacognition | Chat coaches toward surplus that can earn and asks for feedback |

## Categorization brain

- Rule packs: `src/lib/centsy-ai/categorize-rules.ts` (pure, no DB)
- User plasticity: `src/lib/centsy-ai/categorize.ts` (`AiMemory` + recent ledger)

Decision order:

1. Locked user memory for this merchant  
2. Recent ledger history (≥2 same category)  
3. Training rule packs (brands, keywords, delivery tags, Apple subscription hint)  
4. Fallback → Other  

Training priors (seed set from Activity Accepts):

- **Food & Dining** — KFC, Cava, Dunkin', Krispy Kreme, Blaze Pizza, Tropical Smoothie, Food S (keyword), Uber Eats (+ Delivery Services)  
- **Grocery** (UI label; ledger `food` + `grocery` tag until dedicated enum) — Safeway, Albertsons, Food Lion, Lidl  
- **Other** — Stop & Shop (explicit override), Apple (+ subscription naming prompt)  
- **Entertainment** — Netflix, Spotify  
- **Software** — GoDaddy, OpenAI  
- **Transport** — Citgo, PayByPhone, rideshare/fuel/parking  

Secondary tag: **Delivery Services** (Uber Eats, DoorDash, Grubhub, Postmates, Amazon Prime Delivery, TEMU, …).

## Data model

| Model | Role |
|-------|------|
| `User.aiProfile` | Free-text durable profile (family, goals) |
| `AiMemory` | Key/value facts + locked `merchant_cat:*` pathways |
| `ChatThread` / `ChatMessage` | Conversation history + optional `contextJson` audit |
| `Transaction`, `MileageLog`, … | Authoritative financial ledger |

## RAG flow (`POST /api/ai/chat`)

1. Authenticate session (cookie or `Authorization: Bearer`).
2. Persist the user message.
3. Optionally extract durable memories from the utterance.
4. `retrieveUserContext(userId, mode)` builds a context window:
   - profile + memories
   - Personal **and** Business MTD summaries
   - ~80 recent transactions (6 months), biased to active mode
   - recent mileage
5. Call OpenRouter (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`) with:
   - system prompt (neuroscience learning + categorization priors)
   - system message containing the retrieval bundle
   - recent chat turns
6. Persist assistant reply + context metadata.

## Bank inbox (`GET /api/plaid/inbox`)

Each unmatched bank charge includes Centsy AI suggestion fields:

- `suggestedCategory` / `suggestedLabel`
- `suggestedTags` / `suggestionPrecision` / `suggestionReason`
- `subscriptionHint` / `suggestionSource`

`PATCH /api/plaid/inbox/:id` with `action: accept` posts the ledger row and calls `learnMerchantCategory` so the next prediction strengthens.

## API surface

- `GET/POST /api/ai/chat` — history + send message
- `GET/POST /api/ai/memories` — list / upsert memories
- `GET /api/dashboard?mode=` — summary, insights, recent txns
- `GET/POST /api/transactions`
- `GET/POST /api/mileage`
- `GET /api/plaid/inbox?mode=` — realm-scoped inbox + Centsy AI suggestions

## Testing with personas

See `scripts/simulation/README.md` for seeding four user personas and running AI evals that sub-agents can automate later.
