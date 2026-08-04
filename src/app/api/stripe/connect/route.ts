import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { appBaseUrl, getStripe } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api-utils";

const bodySchema = z.object({
  /** Required — Stripe Connect is Business workspace only */
  workspace: z.literal("business"),
});

/**
 * Business workspace only — Stripe Connect Account Link
 * so merchants can connect and Centsy can surface business KPIs.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    if (body.workspace !== "business") {
      return jsonError(
        new Error("Stripe Connect is only available in the Business workspace."),
        403
      );
    }

    const stripe = getStripe();
    let accountId = user.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: { type: "full" },
          fees: { payer: "account" },
          losses: { payments: "stripe" },
          requirement_collection: "stripe",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        email: user.businessEmail || user.email,
        business_profile: {
          name: user.businessName || undefined,
        },
        metadata: { centsyUserId: user.id },
      });

      accountId = account.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const base = appBaseUrl();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/settings?stripe=refresh`,
      return_url: `${base}/settings?stripe=return`,
      type: "account_onboarding",
    });

    return jsonOk({ url: link.url, accountId });
  } catch (error) {
    return jsonError(error);
  }
}

/** Business KPIs from connected Stripe account (charges summary). */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user.stripeAccountId) {
      return jsonOk({
        connected: false,
        kpis: null,
      });
    }

    const stripe = getStripe();
    const connected = { stripeAccount: user.stripeAccountId };
    const balance = await stripe.balance.retrieve(undefined, connected);

    const charges = await stripe.charges.list({ limit: 100 }, connected);

    const gross = charges.data
      .filter((c) => c.paid && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0);

    const available = balance.available.reduce((s, b) => s + b.amount, 0);
    const pending = balance.pending.reduce((s, b) => s + b.amount, 0);

    return jsonOk({
      connected: true,
      accountId: user.stripeAccountId,
      kpis: {
        currency: balance.available[0]?.currency ?? "usd",
        availableCents: available,
        pendingCents: pending,
        recentGrossCents: gross,
        recentChargeCount: charges.data.length,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
