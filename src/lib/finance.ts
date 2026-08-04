import { Prisma, type FinanceMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { TransactionCategory as SharedCategory } from "@/lib/types";
import type { TransactionCategory as PrismaCategory } from "@prisma/client";

type MonthlyCategory = SharedCategory;

export function toMode(mode: string | null | undefined): FinanceMode {
  return mode?.toLowerCase() === "business" ? "BUSINESS" : "PERSONAL";
}

export function fromMode(mode: FinanceMode): "personal" | "business" {
  return mode === "BUSINESS" ? "business" : "personal";
}

export function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value);
}

export async function getMonthlySummary(userId: string, mode: FinanceMode, at = new Date()) {
  const monthStart = startOfMonth(at);
  const monthEnd = endOfMonth(at);
  const prevStart = startOfMonth(subMonths(at, 1));
  const prevEnd = endOfMonth(subMonths(at, 1));

  const [current, previous, byCategoryRaw, cashflow] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, mode, date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.transaction.findMany({
      where: { userId, mode, date: { gte: prevStart, lte: prevEnd } },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        mode,
        type: "EXPENSE",
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    buildCashflow(userId, mode, 6, at),
  ]);

  const income = sumByType(current, "INCOME");
  const expenses = sumByType(current, "EXPENSE");
  const previousIncome = sumByType(previous, "INCOME");
  const previousExpenses = sumByType(previous, "EXPENSE");

  return {
    mode: fromMode(mode),
    month: format(at, "yyyy-MM"),
    income,
    expenses,
    net: income - expenses,
    previousIncome,
    previousExpenses,
    byCategory: byCategoryRaw
      .map((row) => ({
        category: row.category.toLowerCase() as MonthlyCategory,
        amount: decimalToNumber(row._sum.amount ?? 0),
      }))
      .sort((a, b) => b.amount - a.amount),
    cashflow,
  };
}

function sumByType(
  rows: { type: "INCOME" | "EXPENSE"; amount: Prisma.Decimal }[],
  type: "INCOME" | "EXPENSE"
) {
  return rows
    .filter((r) => r.type === type)
    .reduce((sum, r) => sum + decimalToNumber(r.amount), 0);
}

async function buildCashflow(
  userId: string,
  mode: FinanceMode,
  months: number,
  at: Date
) {
  const series = [];
  for (let i = months - 1; i >= 0; i--) {
    const cursor = subMonths(at, i);
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const rows = await prisma.transaction.findMany({
      where: { userId, mode, date: { gte: start, lte: end } },
      select: { type: true, amount: true },
    });
    series.push({
      label: format(cursor, "MMM"),
      income: sumByType(rows, "INCOME"),
      expenses: sumByType(rows, "EXPENSE"),
    });
  }
  return series;
}

export async function serializeTransaction(txn: {
  id: string;
  mode: FinanceMode;
  merchant: string;
  amount: Prisma.Decimal;
  date: Date;
  category: PrismaCategory;
  type: "INCOME" | "EXPENSE";
  notes: string | null;
  receiptUrl: string | null;
  lineItems: Prisma.JsonValue;
  reconciled: boolean;
  createdAt: Date;
}) {
  return {
    id: txn.id,
    mode: fromMode(txn.mode),
    merchant: txn.merchant,
    amount: decimalToNumber(txn.amount),
    date: format(txn.date, "yyyy-MM-dd"),
    category: txn.category.toLowerCase(),
    type: txn.type === "INCOME" ? "income" : "expense",
    notes: txn.notes ?? undefined,
    receiptUrl: txn.receiptUrl ?? undefined,
    lineItems: txn.lineItems ?? undefined,
    reconciled: txn.reconciled,
    createdAt: txn.createdAt.toISOString(),
  };
}

export async function listTransactions(userId: string, mode: FinanceMode, take = 50) {
  const rows = await prisma.transaction.findMany({
    where: { userId, mode },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
  return Promise.all(rows.map(serializeTransaction));
}

export async function listMileage(userId: string, mode: FinanceMode) {
  const rows = await prisma.mileageLog.findMany({
    where: { userId, mode },
    orderBy: { date: "desc" },
  });
  return rows.map((log) => ({
    id: log.id,
    mode: fromMode(log.mode),
    date: format(log.date, "yyyy-MM-dd"),
    miles: log.miles,
    purpose: log.purpose,
    fromLocation: log.fromLocation ?? undefined,
    toLocation: log.toLocation ?? undefined,
    gasCost: log.gasCost != null ? decimalToNumber(log.gasCost) : undefined,
    ratePerMile: decimalToNumber(log.ratePerMile),
    createdAt: log.createdAt.toISOString(),
  }));
}

/** Lightweight derived insights from live activity (not static copy). */
export async function deriveInsights(userId: string, mode: FinanceMode) {
  const summary = await getMonthlySummary(userId, mode);
  const recent = await prisma.transaction.findMany({
    where: {
      userId,
      mode,
      type: "EXPENSE",
      date: { gte: startOfDay(subMonths(new Date(), 1)) },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const insights: {
    id: string;
    mode: "personal" | "business";
    title: string;
    body: string;
    severity: "info" | "warning" | "opportunity";
    metric?: string;
  }[] = [];

  const food = summary.byCategory.find((c) => c.category === "food");
  if (food && food.amount > 150) {
    insights.push({
      id: `food-${mode}`,
      mode: fromMode(mode),
      title: "Food spend is elevated this month",
      body: `You've spent $${food.amount.toFixed(0)} on food. Cap delivery nights and redirect $50/week toward savings so that money can compound.`,
      severity: "warning",
      metric: `$${food.amount.toFixed(0)} food`,
    });
  }

  if (summary.net > 500) {
    insights.push({
      id: `surplus-${mode}`,
      mode: fromMode(mode),
      title: "Surplus can start earning",
      body: `You have about $${summary.net.toFixed(0)} net this month. Automating even 25% into a long-term investment keeps lifestyle flexible while your money works.`,
      severity: "opportunity",
      metric: `$${summary.net.toFixed(0)} net`,
    });
  }

  if (recent.length === 0) {
    insights.push({
      id: `empty-${mode}`,
      mode: fromMode(mode),
      title: "Start building your Centsy brain",
      body: "Snap a receipt or add a transaction. Centsy AI learns from your real activity to answer questions and coach habits.",
      severity: "info",
    });
  } else if (insights.length === 0) {
    insights.push({
      id: `steady-${mode}`,
      mode: fromMode(mode),
      title: "Spending looks steady",
      body: "No sharp impulse spikes detected in this mode. Ask Centsy AI anything about your categories, merchants, or Personal vs Business split.",
      severity: "info",
    });
  }

  return insights;
}

export { startOfDay, endOfDay };
