import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  token: z.string().min(16),
});

/**
 * Accept a read-only accountant invite (token from email / invite URL).
 * Marks invite ACTIVE — full read-only session flow ships with Pro auth.
 */
export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const invite = await prisma.accountantInvite.findUnique({
      where: { token: body.token },
      include: {
        owner: {
          select: { id: true, fullName: true, businessName: true },
        },
      },
    });
    if (!invite || invite.status === "REVOKED") {
      return jsonError(new Error("Invite is invalid or revoked"), 404);
    }
    const updated = await prisma.accountantInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACTIVE",
        acceptedAt: invite.acceptedAt ?? new Date(),
      },
    });
    return jsonOk({
      invite: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        ownerName: invite.owner.fullName,
        businessName: invite.owner.businessName,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
