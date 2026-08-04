import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;

    // deleteMany is idempotent: concurrent/double taps won't throw P2025.
    const result = await prisma.bankAccount.deleteMany({
      where: { id, userId: user.id },
    });

    if (result.count === 0) {
      // Already gone — treat as success so the client can refresh cleanly.
      return jsonOk({ ok: true, alreadyDeleted: true });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
