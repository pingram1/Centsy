import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  key: z.string().min(1).max(64),
  value: z.string().min(1).max(500),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const memories = await prisma.aiMemory.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({ memories });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = schema.parse(await request.json());
    const memory = await prisma.aiMemory.upsert({
      where: { userId_key: { userId: user.id, key: body.key } },
      create: {
        userId: user.id,
        key: body.key,
        value: body.value,
        source: "manual",
      },
      update: { value: body.value, source: "manual" },
    });
    return jsonOk({ memory });
  } catch (error) {
    return jsonError(error);
  }
}

const deleteSchema = z
  .object({
    id: z.string().min(1).optional(),
    key: z.string().min(1).max(64).optional(),
  })
  .refine((v) => Boolean(v.id || v.key), {
    message: "Provide id or key",
  });

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const body = deleteSchema.parse(await request.json());
    if (body.id) {
      await prisma.aiMemory.deleteMany({
        where: { id: body.id, userId: user.id },
      });
    } else if (body.key) {
      await prisma.aiMemory.deleteMany({
        where: { key: body.key, userId: user.id },
      });
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
