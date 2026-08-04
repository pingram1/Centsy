import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api-utils";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * Stripe webhooks: keep Pro plan in sync with subscription lifecycle.
 * Configure endpoint to /api/stripe/webhook with STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.text();
    const jar = await headers();
    const sig = jar.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } else if (process.env.NODE_ENV !== "production") {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      return jsonError(new Error("Missing STRIPE_WEBHOOK_SECRET"), 400);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ||
          session.metadata?.centsyUserId ||
          undefined;
        if (userId && session.subscription) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              stripeSubscriptionId: String(session.subscription),
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id,
            },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.centsyUserId;
        const active = ["active", "trialing"].includes(sub.status);
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: active ? "PRO" : "FREE",
              stripeSubscriptionId: active ? sub.id : null,
            },
          });
        } else if (typeof sub.customer === "string") {
          await prisma.user.updateMany({
            where: { stripeCustomerId: sub.customer },
            data: {
              plan: active ? "PRO" : "FREE",
              stripeSubscriptionId: active ? sub.id : null,
            },
          });
        }
        break;
      }
      default:
        break;
    }

    return jsonOk({ received: true });
  } catch (error) {
    return jsonError(error, 400);
  }
}
