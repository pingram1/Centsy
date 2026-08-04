import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return jsonError(new Error("Invalid email or password"), 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { rawToken, expiresAt } = await createSession(user.id);
    await setSessionCookie(rawToken, expiresAt);

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        defaultMode: user.defaultMode,
      },
      token: rawToken,
    });
  } catch (error) {
    return jsonError(error);
  }
}
