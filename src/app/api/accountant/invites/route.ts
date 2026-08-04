import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { appBaseUrl } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api-utils";

const createSchema = z.object({
  email: z.string().email(),
  workspace: z.literal("business"),
});

/** List + create accountant read-only invites (Business workspace only). */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const invites = await prisma.accountantInvite.findMany({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        token: true,
        createdAt: true,
        acceptedAt: true,
      },
    });
    const base = appBaseUrl();
    return jsonOk({
      invites: invites.map((i) => ({
        ...i,
        inviteUrl: `${base}/accountant/accept?token=${i.token}`,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = createSchema.parse(await request.json());
    if (body.workspace !== "business") {
      return jsonError(
        new Error("Accountant invites are Business workspace only."),
        403
      );
    }

    const email = body.email.toLowerCase().trim();
    const token = randomBytes(24).toString("hex");
    const invite = await prisma.accountantInvite.create({
      data: {
        ownerUserId: user.id,
        email,
        token,
        status: "PENDING",
      },
    });

    const inviteUrl = `${appBaseUrl()}/accountant/accept?token=${invite.token}`;
    return jsonOk({
      invite: {
        id: invite.id,
        email: invite.email,
        status: invite.status,
        createdAt: invite.createdAt,
        inviteUrl,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
