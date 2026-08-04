export type FinanceMode = "personal" | "business";

export type TransactionCategory =
  | "food"
  | "software"
  | "travel"
  | "transport"
  | "housing"
  | "utilities"
  | "healthcare"
  | "shopping"
  | "entertainment"
  | "office"
  | "marketing"
  | "income"
  | "other";

export type InsightSeverity = "info" | "warning" | "opportunity";

export interface LineItem {
  name: string;
  amount: number;
  quantity?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  mode: FinanceMode;
  merchant: string;
  amount: number;
  date: string;
  category: TransactionCategory;
  type: "expense" | "income";
  notes?: string;
  receiptUrl?: string;
  lineItems?: LineItem[];
  reconciled: boolean;
  bankTransactionId?: string;
  createdAt: string;
}

export interface MileageLog {
  id: string;
  userId: string;
  mode: FinanceMode;
  date: string;
  miles: number;
  purpose: string;
  fromLocation?: string;
  toLocation?: string;
  gasCost?: number;
  ratePerMile: number;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  mode: FinanceMode;
  institutionName: string;
  accountName: string;
  mask: string;
  type: "checking" | "savings" | "credit";
  balance: number;
  plaidItemId?: string;
  connectedAt: string;
}

export interface BankFeedItem {
  id: string;
  bankAccountId: string;
  mode: FinanceMode;
  merchant: string;
  amount: number;
  date: string;
  pending: boolean;
  matchedTransactionId?: string;
}

export interface Insight {
  id: string;
  mode: FinanceMode;
  title: string;
  body: string;
  severity: InsightSeverity;
  actionLabel?: string;
  actionHref?: string;
  metric?: string;
}

export interface MonthlySummary {
  mode: FinanceMode;
  month: string;
  income: number;
  expenses: number;
  net: number;
  previousIncome: number;
  previousExpenses: number;
  byCategory: { category: TransactionCategory; amount: number }[];
  cashflow: { label: string; income: number; expenses: number }[];
}

export interface VisionExtractResult {
  merchant: string;
  total: number;
  date: string;
  category: TransactionCategory;
  lineItems: LineItem[];
  confidence: number;
  rawText?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  defaultMode: FinanceMode;
}
