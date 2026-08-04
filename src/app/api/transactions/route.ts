import { z } from "zod";
import {
  Prisma,
  type TransactionCategory,
  type TransactionType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  listTransactions,
  serializeTransaction,
  toMode,
} from "@/lib/finance";
import { jsonError, jsonOk } from "@/lib/api-utils";

const createSchema = z.object({
  mode: z.enum(["personal", "business"]),
  merchant: z.string().min(1).max(200),
  amount: z.number().positive(),
  date: z.string().min(4),
  category: z.string().min(1),
  type: z.enum(["expense", "income"]).default("expense"),
  notes: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
        quantity: z.number().optional(),
      })
    )
    .optional(),
  receiptUrl: z.string().optional(),
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

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const mode = toMode(new URL(request.url).searchParams.get("mode"));
    const transactions = await listTransactions(user.id, mode, 100);
    return jsonOk({ transactions });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = createSchema.parse(await request.json());
    const type: TransactionType =
      body.type === "income" ? "INCOME" : "EXPENSE";

    const created = await prisma.transaction.create({
      data: {
        userId: user.id,
        mode: toMode(body.mode),
        merchant: body.merchant,
        amount: body.amount,
        date: new Date(body.date),
        category: type === "INCOME" ? "INCOME" : toCategory(body.category),
        type,
        notes: body.notes,
        lineItems: body.lineItems as unknown as Prisma.InputJsonValue | undefined,
        receiptUrl: body.receiptUrl,
      },
    });

    return jsonOk({ transaction: await serializeTransaction(created) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
