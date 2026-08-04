import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { appBaseUrl, getStripe } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api-utils";

/**
 * Centsy Pro — subscription Checkout Session.
 * Omit payment_method_types (dynamic payment methods).
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return jsonError(
        new Error(
          "STRIPE_PRO_PRICE_ID is not set. Create a Product/Price in Stripe and add it to .env.local."
        ),
        503
      );
    }

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { centsyUserId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const suffix = randomBytes(4).toString("hex");
    const base = appBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/settings?checkout=success`,
      cancel_url: `${base}/settings?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { centsyUserId: user.id },
      subscription_data: {
        metadata: { centsyUserId: user.id },
      },
      integration_identifier: `centsy_pro_${suffix}`,
    });

    return jsonOk({ url: session.url, sessionId: session.id });
  } catch (error) {
    return jsonError(error);
  }
}
