import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/format";
import type { TransactionCategory } from "@/lib/types";
import {
  baseSuggestion,
  normalizeMerchant,
  predictCategoryFromRules,
  type CategorySuggestion,
} from "@/lib/centsy-ai/categorize-rules";

export type {
  CategorySuggestion,
  SuggestionPrecision,
} from "@/lib/centsy-ai/categorize-rules";
export { normalizeMerchant, predictCategoryFromRules } from "@/lib/centsy-ai/categorize-rules";

const MEMORY_PREFIX = "merchant_cat:";

function memoryKey(merchant: string): string {
  return `${MEMORY_PREFIX}${normalizeMerchant(merchant)}`;
}

function labelFor(
  category: TransactionCategory,
  rule: CategorySuggestion
): string {
  if (rule.tags.includes("grocery") && category === "food") return "Grocery";
  return categoryLabel(category);
}

/**
 * Centsy AI inbox suggestion: predictive processing + synaptic plasticity.
 * 1) Locked user memory for this merchant (strongest)
 * 2) Recent ledger history for this merchant (≥2 same category → lock-ish)
 * 3) Training rule packs
 */
export async function suggestCategoryForUser(
  userId: string,
  merchant: string,
  amountAbs?: number
): Promise<CategorySuggestion> {
  const key = memoryKey(merchant);
  const norm = normalizeMerchant(merchant);

  const [memory, history] = await Promise.all([
    prisma.aiMemory.findUnique({
      where: { userId_key: { userId, key } },
      select: { value: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        merchant: { contains: merchant.slice(0, 24), mode: "insensitive" },
        date: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
      select: { category: true, merchant: true, amount: true },
      orderBy: { date: "desc" },
      take: 12,
    }),
  ]);

  if (memory?.value) {
    const category = memory.value.toLowerCase() as TransactionCategory;
    const rule = predictCategoryFromRules(merchant, amountAbs);
    return baseSuggestion(category, {
      label: labelFor(category, rule),
      tags: rule.tags,
      precision: "high",
      confidence: 0.98,
      reason: `Locked from your past Accept — I won't second-guess ${merchant}.`,
      subscriptionHint: rule.subscriptionHint,
      source: "user_memory",
    });
  }

  const matched = history.filter((h) => {
    const hn = normalizeMerchant(h.merchant);
    return hn === norm || hn.includes(norm) || norm.includes(hn);
  });
  if (matched.length >= 2) {
    const counts = new Map<string, number>();
    for (const row of matched) {
      const c = row.category.toLowerCase();
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    let best = "other";
    let bestN = 0;
    for (const [c, n] of counts) {
      if (n > bestN) {
        best = c;
        bestN = n;
      }
    }
    if (bestN >= 2) {
      const category = best as TransactionCategory;
      const rule = predictCategoryFromRules(merchant, amountAbs);
      return baseSuggestion(category, {
        label: labelFor(category, rule),
        tags: rule.tags,
        precision: "high",
        confidence: Math.min(0.97, 0.7 + bestN * 0.08),
        reason: `You've categorized this merchant as ${categoryLabel(category)} ${bestN}× recently — strengthening that pathway.`,
        subscriptionHint: rule.subscriptionHint,
        source: "user_history",
      });
    }
  }

  return predictCategoryFromRules(merchant, amountAbs);
}

/** Batch suggestions for inbox (one memory + history pass). */
export async function suggestCategoriesForInbox(
  userId: string,
  rows: { merchant: string; amount: number }[]
): Promise<CategorySuggestion[]> {
  if (rows.length === 0) return [];

  const memories = await prisma.aiMemory.findMany({
    where: {
      userId,
      key: { startsWith: MEMORY_PREFIX },
    },
    select: { key: true, value: true },
  });
  const memoryMap = new Map(
    memories.map((m) => [m.key, m.value.toLowerCase() as TransactionCategory])
  );

  const merchants = [...new Set(rows.map((r) => r.merchant))];
  const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const history =
    merchants.length === 0
      ? []
      : await prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: since },
            OR: merchants.slice(0, 40).map((merchant) => ({
              merchant: {
                contains: merchant.slice(0, 20),
                mode: "insensitive" as const,
              },
            })),
          },
          select: { category: true, merchant: true },
          take: 200,
        });

  return rows.map((row) => {
    const key = memoryKey(row.merchant);
    const amountAbs = Math.abs(row.amount);
    const memorized = memoryMap.get(key);
    if (memorized) {
      const rule = predictCategoryFromRules(row.merchant, amountAbs);
      return baseSuggestion(memorized, {
        label: labelFor(memorized, rule),
        tags: rule.tags,
        precision: "high",
        confidence: 0.98,
        reason: `Locked from your past Accept — I won't second-guess ${row.merchant}.`,
        subscriptionHint: rule.subscriptionHint,
        source: "user_memory",
      });
    }

    const norm = normalizeMerchant(row.merchant);
    const matched = history.filter((h) => {
      const hn = normalizeMerchant(h.merchant);
      return hn === norm || hn.includes(norm) || norm.includes(hn);
    });
    if (matched.length >= 2) {
      const counts = new Map<string, number>();
      for (const h of matched) {
        const c = h.category.toLowerCase();
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      let best = "other";
      let bestN = 0;
      for (const [c, n] of counts) {
        if (n > bestN) {
          best = c;
          bestN = n;
        }
      }
      if (bestN >= 2) {
        const category = best as TransactionCategory;
        const rule = predictCategoryFromRules(row.merchant, amountAbs);
        return baseSuggestion(category, {
          label: labelFor(category, rule),
          tags: rule.tags,
          precision: "high",
          confidence: Math.min(0.97, 0.7 + bestN * 0.08),
          reason: `Recent habit: ${categoryLabel(category)} (${bestN}×).`,
          subscriptionHint: rule.subscriptionHint,
          source: "user_history",
        });
      }
    }

    return predictCategoryFromRules(row.merchant, amountAbs);
  });
}

/**
 * Synaptic plasticity: lock merchant → category after user Accept.
 * Prediction errors (user corrects) overwrite the pathway immediately.
 */
export async function learnMerchantCategory(
  userId: string,
  merchant: string,
  category: string,
  source = "inbox_accept"
) {
  const key = memoryKey(merchant);
  const value = category.toLowerCase();
  await prisma.aiMemory.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, value, source },
    update: { value, source },
  });
}
