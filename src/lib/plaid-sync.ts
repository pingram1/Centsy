import { format, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getPlaidClient } from "@/lib/plaid";
import { predictCategoryFromRules } from "@/lib/centsy-ai/categorize-rules";
import type { FinanceMode } from "@prisma/client";

/**
 * Sync / fallback category guess — delegates to Centsy AI rule priors.
 * Prefer `suggestCategoriesForInbox` when a userId is available so Accept
 * history can strengthen pathways.
 */
export function guessCategory(merchant: string): string {
  return predictCategoryFromRules(merchant).category;
}

export async function syncBankAccount(bankAccountId: string, userId: string) {
  const bank = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, userId },
  });
  if (!bank?.plaidAccessEnc) {
    throw new Error("Bank account is not linked to Plaid");
  }

  const { client } = getPlaidClient();
  const start = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const end = format(new Date(), "yyyy-MM-dd");

  const response = await client.transactionsGet({
    access_token: bank.plaidAccessEnc,
    start_date: start,
    end_date: end,
    options: { count: 100, offset: 0 },
  });

  let upserted = 0;
  for (const txn of response.data.transactions) {
    const merchant = txn.merchant_name || txn.name || "Bank charge";
    // Always inherit the bank account's workspace — never cross realms.
    await prisma.bankTransaction.upsert({
      where: { plaidTxnId: txn.transaction_id },
      create: {
        bankAccountId: bank.id,
        mode: bank.mode,
        merchant,
        amount: txn.amount,
        date: new Date(txn.date),
        pending: Boolean(txn.pending),
        plaidTxnId: txn.transaction_id,
      },
      update: {
        merchant,
        amount: txn.amount,
        date: new Date(txn.date),
        pending: Boolean(txn.pending),
        mode: bank.mode,
      },
    });
    upserted += 1;
  }

  const accounts = await client.accountsGet({
    access_token: bank.plaidAccessEnc,
  });
  const primary = accounts.data.accounts[0];
  await prisma.bankAccount.update({
    where: { id: bank.id },
    data: {
      balance: primary?.balances.current ?? bank.balance,
      lastSyncedAt: new Date(),
    },
  });

  return { upserted, total: response.data.total_transactions };
}

/** Sync only banks belonging to one workspace realm. */
export async function syncBanksForMode(userId: string, mode: FinanceMode) {
  const banks = await prisma.bankAccount.findMany({
    where: { userId, mode, plaidAccessEnc: { not: null } },
    select: { id: true },
  });
  let upserted = 0;
  for (const b of banks) {
    const result = await syncBankAccount(b.id, userId);
    upserted += result.upserted;
  }
  return { accounts: banks.length, upserted, mode };
}
