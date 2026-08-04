import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";
import {
  CENTSY_SYSTEM_PROMPT,
  retrieveUserContext,
} from "@/lib/centsy-ai/rag";
import { chatWithOpenRouter } from "@/lib/centsy-ai/openrouter";

const schema = z.object({
  message: z.string().min(1).max(4000),
  mode: z.enum(["personal", "business"]).default("personal"),
  threadId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const threadId = new URL(request.url).searchParams.get("threadId");

    let thread = threadId
      ? await prisma.chatThread.findFirst({
          where: { id: threadId, userId: user.id },
        })
      : await prisma.chatThread.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
        });

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: { userId: user.id, title: "Centsy AI" },
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return jsonOk({
      thread: { id: thread.id, title: thread.title },
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());

    let thread = body.threadId
      ? await prisma.chatThread.findFirst({
          where: { id: body.threadId, userId: user.id },
        })
      : await prisma.chatThread.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
        });

    if (!thread) {
      thread = await prisma.chatThread.create({
        data: { userId: user.id, title: "Centsy AI" },
      });
    }

    await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: "USER",
        content: body.message,
      },
    });

    // Persist simple durable memories when the user states life facts
    await maybeCaptureMemory(user.id, body.message);

    const rag = await retrieveUserContext(user.id, body.mode);
    const history = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const { content, model } = await chatWithOpenRouter([
      { role: "system", content: CENTSY_SYSTEM_PROMPT },
      {
        role: "system",
        content: `LIVE DATABASE CONTEXT (authoritative):\n${rag.contextText}`,
      },
      ...history.map((m) => ({
        role: (m.role === "ASSISTANT" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: m.content,
      })),
    ]);

    const assistant = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: "ASSISTANT",
        content,
        contextJson: {
          model,
          mode: body.mode,
          txnCount: rag.recentTransactions.length,
          memoryCount: rag.memories.length,
        },
      },
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return jsonOk({
      threadId: thread.id,
      message: {
        id: assistant.id,
        role: "assistant",
        content: assistant.content,
        createdAt: assistant.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

async function maybeCaptureMemory(userId: string, message: string) {
  const lower = message.toLowerCase();
  const patterns: { test: RegExp; key: string; value: string }[] = [
    {
      test: /\b(two kids|2 kids|two children)\b/,
      key: "family",
      value: "Has two kids",
    },
    {
      test: /\b(college student|in college)\b/,
      key: "life_stage",
      value: "College student",
    },
    {
      test: /\b(dog|puppy)\b/,
      key: "pets",
      value: "Has a dog",
    },
    {
      test: /\b(ceo|founder)\b/,
      key: "role",
      value: "Executive / founder",
    },
  ];

  for (const p of patterns) {
    if (p.test.test(lower)) {
      await prisma.aiMemory.upsert({
        where: { userId_key: { userId, key: p.key } },
        create: { userId, key: p.key, value: p.value, source: "chat" },
        update: { value: p.value, source: "chat" },
      });
    }
  }
}
