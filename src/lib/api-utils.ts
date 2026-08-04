import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown, fallbackStatus = 500) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 400 }
    );
  }
  const message =
    error instanceof Error ? error.message : "Unexpected server error";
  const status = message.includes("OPENROUTER_API_KEY") ? 503 : fallbackStatus;
  console.error(error);
  return NextResponse.json({ error: message }, { status });
}
