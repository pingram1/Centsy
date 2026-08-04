import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  destroySession,
  requireUser,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  confirm: z.literal("DELETE"),
});

/** Permanently delete the signed-in user and all cascade data. */
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    schema.parse(await request.json());

    let rawToken: string | undefined;
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      rawToken = auth.slice(7).trim();
    } else {
      const jar = await cookies();
      rawToken = jar.get(SESSION_COOKIE)?.value;
    }

    await prisma.user.delete({ where: { id: user.id } });
    await destroySession(rawToken);
    await clearSessionCookie();

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
