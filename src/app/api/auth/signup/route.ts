import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError(new Error("An account with this email already exists"), 409);
    }

    const user = await prisma.user.create({
      data: {
        email,
        fullName: body.fullName.trim(),
        passwordHash: await hashPassword(body.password),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        defaultMode: true,
      },
    });

    // Seed a default Centsy AI thread
    await prisma.chatThread.create({
      data: { userId: user.id, title: "Centsy AI" },
    });

    const { rawToken, expiresAt } = await createSession(user.id);
    await setSessionCookie(rawToken, expiresAt);

    return jsonOk({ user, token: rawToken });
  } catch (error) {
    return jsonError(error);
  }
}
