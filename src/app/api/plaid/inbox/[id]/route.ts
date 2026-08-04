import { z } from "zod";
import {
  Prisma,
  type TransactionCategory,
  type TransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { decimalToNumber } from "@/lib/finance";
import {
  learnMerchantCategory,
} from "@/lib/centsy-ai/categorize";
import { predictCategoryFromRules } from "@/lib/centsy-ai/categorize-rules";
import { jsonError, jsonOk } from "@/lib/api-utils";

const patchSchema = z.object({
  action: z.enum(["accept", "ignore"]),
  category: z.string().optional(),
});

function toCategory(raw: string): TransactionCategory {
  const key = raw.toUpperCase().replace(/[^A-Z]/g, "_");
  const allowed: TransactionCategory[] = [
    "FOOD",
    "SOFTWARE",
    "TRAVEL",
    "TRANSPORT",
    "HOUSING",
    "UTILITIES",
    "HEALTHCARE",
    "SHOPPING",
    "ENTERTAINMENT",
    "OFFICE",
    "MARKETING",
    "INCOME",
    "OTHER",
  ];
  return (allowed.includes(key as TransactionCategory)
    ? key
    : "OTHER") as TransactionCategory;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    const bankTxn = await prisma.bankTransaction.findFirst({
      where: {
        id,
        bankAccount: { userId: user.id },
      },
      include: {
        matchedTxn: true,
        bankAccount: { select: { mode: true } },
      },
    });
    if (!bankTxn) {
      return jsonError(new Error("Bank transaction not found"), 404);
    }

    // Realm lock: bank txn mode must match its bank account workspace
    if (bankTxn.mode !== bankTxn.bankAccount.mode) {
      await prisma.bankTransaction.update({
        where: { id },
        data: { mode: bankTxn.bankAccount.mode },
      });
      bankTxn.mode = bankTxn.bankAccount.mode;
    }

    if (body.action === "ignore") {
      await prisma.bankTransaction.update({
        where: { id },
        data: { ignored: true },
      });
      return jsonOk({ ok: true });
    }

    if (bankTxn.matchedTxn) {
      return jsonOk({ ok: true, alreadyPosted: true });
    }

    const amount = decimalToNumber(bankTxn.amount);
    const type: TransactionType = amount < 0 ? "INCOME" : "EXPENSE";
    const absAmount = Math.abs(amount);
    const predicted = predictCategoryFromRules(bankTxn.merchant, absAmount);
    const category =
      type === "INCOME"
        ? "INCOME"
        : toCategory(body.category || predicted.category);

    const tagNote =
      predicted.tags.length > 0
        ? ` Tags: ${predicted.tags.join(", ")}.`
        : "";
    const created = await prisma.$transaction(async (tx) => {
      const ledger = await tx.transaction.create({
        data: {
          userId: user.id,
          mode: bankTxn.bankAccount.mode,
          merchant: bankTxn.merchant,
          amount: new Prisma.Decimal(absAmount),
          date: bankTxn.date,
          category,
          type,
          reconciled: true,
          bankTransactionId: bankTxn.id,
          notes: `Posted from connected bank · Centsy AI.${tagNote}`,
        },
      });
      await tx.bankTransaction.update({
        where: { id: bankTxn.id },
        data: { mode: bankTxn.bankAccount.mode, ignored: false },
      });
      return ledger;
    });

    // Synaptic plasticity: lock this merchant pathway from the Accept.
    if (type === "EXPENSE") {
      await learnMerchantCategory(
        user.id,
        bankTxn.merchant,
        category.toLowerCase(),
        "inbox_accept"
      );
    }

    return jsonOk({
      ok: true,
      transactionId: created.id,
      learned: type === "EXPENSE",
    });
  } catch (error) {
    return jsonError(error);
  }
}
