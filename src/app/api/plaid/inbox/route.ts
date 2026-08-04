import { startOfWeek, endOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { decimalToNumber, fromMode, toMode } from "@/lib/finance";
import { suggestCategoriesForInbox } from "@/lib/centsy-ai/categorize";
import { jsonError, jsonOk } from "@/lib/api-utils";

/** Unmatched bank charges for one workspace realm only. */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const modeParam = searchParams.get("mode");
    if (modeParam !== "personal" && modeParam !== "business") {
      return jsonError(
        new Error("mode=personal|business is required"),
        400
      );
    }
    const mode = toMode(modeParam);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

    const bankScope = { userId: user.id, mode };

    const [inbox, weekRows, accounts] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: {
          bankAccount: bankScope,
          ignored: false,
          matchedTxn: null,
          mode,
        },
        orderBy: { date: "desc" },
        take: 40,
        include: {
          bankAccount: {
            select: { institutionName: true, mask: true },
          },
        },
      }),
      prisma.bankTransaction.findMany({
        where: {
          bankAccount: bankScope,
          ignored: false,
          mode,
          date: { gte: weekStart, lte: weekEnd },
        },
        select: {
          id: true,
          matchedTxn: { select: { id: true } },
        },
      }),
      prisma.bankAccount.findMany({
        where: bankScope,
        select: {
          id: true,
          institutionName: true,
          accountName: true,
          mask: true,
          balance: true,
          type: true,
          lastSyncedAt: true,
        },
        orderBy: { connectedAt: "desc" },
      }),
    ]);

    const amounts = inbox.map((row) => ({
      merchant: row.merchant,
      amount: decimalToNumber(row.amount as never),
    }));
    const suggestions = await suggestCategoriesForInbox(user.id, amounts);

    const serialized = inbox.map((row, i) => {
      const amount = decimalToNumber(row.amount as never);
      const suggestion = suggestions[i]!;
      return {
        id: row.id,
        merchant: row.merchant,
        amount,
        date: row.date.toISOString(),
        pending: row.pending,
        mode: fromMode(row.mode),
        institutionName: row.bankAccount.institutionName,
        mask: row.bankAccount.mask,
        suggestedCategory: suggestion.category,
        suggestedLabel: suggestion.label,
        suggestedTags: suggestion.tags,
        suggestionPrecision: suggestion.precision,
        suggestionReason: suggestion.reason,
        subscriptionHint: suggestion.subscriptionHint ?? null,
        suggestionSource: suggestion.source,
        type: amount < 0 ? ("income" as const) : ("expense" as const),
      };
    });

    const weekTotal = weekRows.length;
    const weekMatched = weekRows.filter((r) => r.matchedTxn).length;

    return jsonOk({
      plan: user.plan || "FREE",
      mode: modeParam,
      inbox: serialized,
      pulse: {
        weekTotal,
        weekMatched,
        weekOpen: weekTotal - weekMatched,
        matchPercent:
          weekTotal === 0 ? 100 : Math.round((weekMatched / weekTotal) * 100),
        balances: accounts.map((a) => ({
          id: a.id,
          label: `${a.institutionName} ···${a.mask}`,
          balance: decimalToNumber(a.balance),
          type: a.type.toLowerCase(),
          lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
        })),
        totalCash: accounts
          .filter((a) => a.type !== "CREDIT")
          .reduce((s, a) => s + decimalToNumber(a.balance), 0),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
