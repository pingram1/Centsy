import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-utils";

/** Revoke an accountant invite. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const invite = await prisma.accountantInvite.findFirst({
      where: { id, ownerUserId: user.id },
    });
    if (!invite) {
      return jsonError(new Error("Invite not found"), 404);
    }
    await prisma.accountantInvite.update({
      where: { id },
      data: { status: "REVOKED" },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
