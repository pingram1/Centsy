import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendExpoPush } from "@/lib/push";
import { jsonError, jsonOk } from "@/lib/api-utils";

const schema = z.object({
  /** When true, only notify the current user (test from Profile). */
  selfOnly: z.boolean().optional(),
});

/**
 * Send weekly review push. Call from a cron (Authorization: Bearer CRON_SECRET)
 * or from the signed-in user with { selfOnly: true } for a test ping.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const auth = request.headers.get("authorization");
    const isCron =
      Boolean(cronSecret) && auth === `Bearer ${cronSecret}`;

    let userId: string | undefined;

    if (!isCron) {
      // Signed-in users may only test-push themselves — never broadcast.
      const user = await requireUser(request);
      userId = user.id;
      schema.parse(await request.json().catch(() => ({})));
    }

    const users = await prisma.user.findMany({
      where: {
        expoPushToken: { not: null },
        ...(isCron ? {} : { id: userId }),
      },
      select: { id: true, expoPushToken: true, fullName: true },
    });

    const tokens = users
      .map((u) => u.expoPushToken)
      .filter((t): t is string => Boolean(t));

    const result = await sendExpoPush(tokens, {
      title: "Centsy weekly review",
      body: "Take 2 minutes to close the week—receipts, mileage, and anything to categorize.",
      data: { type: "weekly_review" },
      sound: "default",
    });

    return jsonOk({
      recipients: users.length,
      ...result,
    });
  } catch (error) {
    return jsonError(error);
  }
}
