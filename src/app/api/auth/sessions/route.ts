import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const sessions = await prisma.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
      },
    });
    return jsonOk({
      sessions,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    return jsonError(error);
  }
}
