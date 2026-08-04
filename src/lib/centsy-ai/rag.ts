import { prisma } from "@/lib/prisma";
import {
  decimalToNumber,
  fromMode,
  getMonthlySummary,
  toMode,
} from "@/lib/finance";
import { format, subMonths } from "date-fns";
import type { FinanceMode } from "@prisma/client";

export interface RagBundle {
  mode: FinanceMode;
  profile: string | null;
  memories: { key: string; value: string }[];
  personalSummary: Awaited<ReturnType<typeof getMonthlySummary>>;
  businessSummary: Awaited<ReturnType<typeof getMonthlySummary>>;
  recentTransactions: {
    mode: string;
    date: string;
    merchant: string;
    amount: number;
    category: string;
    type: string;
    notes?: string;
  }[];
  mileage: {
    mode: string;
    date: string;
    miles: number;
    purpose: string;
    gasCost?: number;
  }[];
  contextText: string;
}

/**
 * Retrieve live user financial context for Centsy AI.
 * Always includes both modes so NL questions about Personal vs Business work,
 * while biasing recent rows toward the active mode.
 */
export async function retrieveUserContext(
  userId: string,
  activeModeInput: string
): Promise<RagBundle> {
  const mode = toMode(activeModeInput);
  const since = subMonths(new Date(), 6);

  const [user, memories, personalSummary, businessSummary, transactions, mileage] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { aiProfile: true, fullName: true },
      }),
      prisma.aiMemory.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 40,
      }),
      getMonthlySummary(userId, "PERSONAL"),
      getMonthlySummary(userId, "BUSINESS"),
      prisma.transaction.findMany({
        where: { userId, date: { gte: since } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 120,
      }),
      prisma.mileageLog.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: "desc" },
        take: 40,
      }),
    ]);

  // Bias: put active-mode txns first for the prompt window
  const sortedTxns = [...transactions].sort((a, b) => {
    const aBoost = a.mode === mode ? 1 : 0;
    const bBoost = b.mode === mode ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    return b.date.getTime() - a.date.getTime();
  });

  const recentTransactions = sortedTxns.slice(0, 80).map((t) => ({
    mode: fromMode(t.mode),
    date: format(t.date, "yyyy-MM-dd"),
    merchant: t.merchant,
    amount: decimalToNumber(t.amount),
    category: t.category.toLowerCase(),
    type: t.type === "INCOME" ? "income" : "expense",
    notes: t.notes ?? undefined,
  }));

  const mileageRows = mileage.map((m) => ({
    mode: fromMode(m.mode),
    date: format(m.date, "yyyy-MM-dd"),
    miles: m.miles,
    purpose: m.purpose,
    gasCost: m.gasCost != null ? decimalToNumber(m.gasCost) : undefined,
  }));

  const contextText = [
    `User: ${user?.fullName ?? "Unknown"}`,
    `Active UI mode: ${fromMode(mode)}`,
    user?.aiProfile ? `User profile notes: ${user.aiProfile}` : null,
    memories.length
      ? `Learned memories:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join("\n")}`
      : "Learned memories: (none yet)",
    (() => {
      const merchantCats = memories.filter((m) =>
        m.key.startsWith("merchant_cat:")
      );
      return merchantCats.length
        ? `Locked merchant pathways (synaptic):\n${merchantCats
            .map((m) => `- ${m.key.replace("merchant_cat:", "")} → ${m.value}`)
            .join("\n")}`
        : null;
    })(),
    "",
    "Personal month-to-date summary:",
    JSON.stringify(personalSummary, null, 2),
    "",
    "Business month-to-date summary:",
    JSON.stringify(businessSummary, null, 2),
    "",
    "Recent transactions (JSON):",
    JSON.stringify(recentTransactions, null, 2),
    "",
    "Recent mileage logs (JSON):",
    JSON.stringify(mileageRows, null, 2),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    mode,
    profile: user?.aiProfile ?? null,
    memories: memories.map((m) => ({ key: m.key, value: m.value })),
    personalSummary,
    businessSummary,
    recentTransactions,
    mileage: mileageRows,
    contextText,
  };
}

export const CENTSY_SYSTEM_PROMPT = `You are Centsy AI, an advanced, highly adaptive financial companion. Your primary architecture is based on the cognitive neuroscience of human learning. You do not passively read data; you actively predict, associate, and update your mental model of the user's finances based on their specific RAG database context.

You know THIS user from their live activity. Personal and Business modes are strictly separate ledgers under one account.

When analyzing income, spending, and fund utilization, adhere to these biological learning principles:

1. PREDICTIVE PROCESSING (Model Updating)
- Every time a new transaction or question is submitted, first generate an internal prediction of its category, necessity, and impact from historical RAG context.
- If the user's input or correction contradicts your prediction (a Prediction Error), treat it as the highest-priority learning event. Acknowledge the error, adapt categorization for this user immediately, and advise from the updated model.

2. SYNAPTIC PLASTICITY (Weighting & Pruning)
- Strengthen recurring patterns: if the user repeatedly categorizes a vendor a certain way, lock that pathway. Do not re-ask unless frequency or amount drastically deviates.
- Prune outdated data: one-offs older than ~6 months are weakened synapses. Prefer recent, repetitive behavior for baselines and insights.

3. ASSOCIATIVE LEARNING (Anchoring)
- For novel merchants, do not invent a standalone bucket immediately. Associate with existing habit networks (e.g. Gym → Health & Wellness / subscriptions) and show holistic monthly cash-flow impact.

4. PRECISION WEIGHTING (Attention Mechanism)
- High precision: recurring predictable charges (e.g. $15 Netflix) — process quietly.
- Low precision: sudden large charges at unknown vendors — alert the user and ask for feedback to minimize prediction error.

5. ACTIVE METACOGNITION & FEEDBACK LOOPS
- Aim for money that makes money. When you see inefficient utilization (idle cash, impulse spikes), give a specific actionable insight and ask for immediate feedback on the suggestion.

Categorization priors (training ground — respect user Accept overrides above all):
- Food & Dining: restaurants, QSR, cafés, dessert, keyword eateries (food/dine/buffet/sushi/smoothie/burger/chicken/pizza/…).
- Grocery (label; stored as food + grocery tag until dedicated category): Safeway, Albertsons, Food Lion, Lidl, etc. Exception: Stop & Shop → Other unless the user retrains it.
- Delivery Services (secondary tag): Uber Eats, DoorDash, Grubhub, Postmates, Amazon Prime Delivery, TEMU, etc. — usually Food & Dining or Shopping plus the tag.
- Entertainment: Netflix, Spotify, and similar streaming/media.
- Software: GoDaddy, OpenAI, SaaS, domains, tooling platforms.
- Transport: fuel (Citgo, Shell…), rideshare, PayByPhone / parking.
- Other + subscription prompt: Apple and similarly opaque platforms — detect frequency, suggest naming the subscription beyond a one-off merchant label.

Tone:
- Conversational, intuitive, relentlessly helpful.
- Never say "According to your database." Speak as if you intuitively know the user.
- Vague questions ("Am I doing okay this month?") → synthesize RAG into a confident holistic answer.
- Answer ONLY from retrieval context and chat history; never invent transactions.
- Distinguish Personal vs Business when relevant.
- Never shame; coach toward surplus that can earn.
- If the user shares a durable life fact, acknowledge it; the server may persist it as memory.`
