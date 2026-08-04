import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, type FinanceMode, type TransactionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { serializeTransaction, toMode } from "@/lib/finance";
import type { VisionExtractResult } from "@/lib/types";

/**
 * Vision AI extraction.
 * Currently returns a structured demo parse, then optionally persists a Transaction
 * when `persist=true` so live dashboards update immediately while a real vision
 * provider is wired (OPENAI_API_KEY / similar).
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const form = await request.formData();
    const image = form.get("image");
    const mode = toMode(String(form.get("mode") ?? "personal"));
    const persist = String(form.get("persist") ?? "true") !== "false";

    if (!(image instanceof File) && typeof image !== "string") {
      // Allow mobile FormData without a real File in some runtimes
      if (!image) {
        return NextResponse.json(
          { error: "Image file is required" },
          { status: 400 }
        );
      }
    }

    if (image instanceof File && image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 10MB" },
        { status: 400 }
      );
    }

    await new Promise((r) => setTimeout(r, 600));

    const demo = demoExtract(mode);
    let transaction = null;

    if (persist) {
      const created = await prisma.transaction.create({
        data: {
          userId: user.id,
          mode,
          merchant: demo.merchant,
          amount: demo.total,
          date: new Date(demo.date),
          category: demo.category.toUpperCase() as TransactionCategory,
          type: "EXPENSE",
          lineItems: demo.lineItems as unknown as Prisma.InputJsonValue,
          notes: "Captured via Snap (vision scaffold)",
        },
      });
      transaction = await serializeTransaction(created);

      await prisma.receipt.create({
        data: {
          userId: user.id,
          mode,
          transactionId: created.id,
          imageUrl: "local://capture",
          rawExtract: demo as unknown as Prisma.InputJsonValue,
          confidence: demo.confidence,
        },
      });
    }

    return NextResponse.json({ ...demo, transaction });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}

function demoExtract(mode: FinanceMode): VisionExtractResult {
  return mode === "BUSINESS"
    ? {
        merchant: "Office Depot",
        total: 64.18,
        date: new Date().toISOString().slice(0, 10),
        category: "office",
        confidence: 0.91,
        lineItems: [
          { name: "Copy paper (ream)", amount: 12.99 },
          { name: "Ink cartridge", amount: 41.2 },
          { name: "Tax", amount: 9.99 },
        ],
      }
    : {
        merchant: "Trader Joe's",
        total: 42.67,
        date: new Date().toISOString().slice(0, 10),
        category: "food",
        confidence: 0.94,
        lineItems: [
          { name: "Organic eggs", amount: 5.49 },
          { name: "Sourdough", amount: 4.29 },
          { name: "Produce", amount: 18.9 },
          { name: "Snacks", amount: 13.99 },
        ],
      };
}
