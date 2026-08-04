import { format, parseISO } from "date-fns";
import type { FinanceMode, TransactionCategory } from "./types";

export function formatCurrency(amount: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact && Math.abs(amount) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(date: string, pattern = "MMM d"): string {
  return format(parseISO(date), pattern);
}

export function modeLabel(mode: FinanceMode): string {
  return mode === "personal" ? "Personal" : "Business";
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food: "Food & Dining",
  software: "Software",
  travel: "Travel",
  transport: "Transport",
  housing: "Housing",
  utilities: "Utilities",
  healthcare: "Healthcare",
  shopping: "Shopping",
  entertainment: "Entertainment",
  office: "Office",
  marketing: "Marketing",
  income: "Income",
  other: "Other",
};

export function categoryLabel(category: TransactionCategory): string {
  return CATEGORY_LABELS[category];
}

export function changePercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}
