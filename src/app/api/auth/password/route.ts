import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const sessionUser = await requireUser(request);
    const body = schema.parse(await request.json());

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    });

    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return jsonError(new Error("Current password is incorrect"), 400);
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
